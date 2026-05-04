import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { pipeline } from 'stream';
import { promisify } from 'util';
import * as readline from 'readline';

const pipelineAsync = promisify(pipeline);

interface MetricPoint {
  metric: string;
  type: 'Point';
  data: {
    time: string;
    value: number;
    tags: Record<string, string>;
  };
}

interface MetricDefinition {
  type: 'Metric';
  data: {
    name: string;
    type: string;
    contains: string;
    thresholds: unknown[];
    submetrics: unknown;
  };
  metric: string;
}

type K6Line = MetricPoint | MetricDefinition;

interface AggregatedMetric {
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  values: number[];
}

interface TimeBucket {
  startTime: Date;
  endTime: Date;
  metrics: Map<string, AggregatedMetric>;
  errorCount: number;
  requestCount: number;
}

interface OptimizedResult {
  metadata: {
    testName: string;
    startTime: string;
    endTime: string;
    totalDuration: number;
    totalRequests: number;
    totalIterations: number;
    errorRate: number;
    bucketSizeSeconds: number;
    compressionRatio: number;
  };
  summary: {
    http_req_duration: AggregatedMetric;
    http_req_blocked: AggregatedMetric;
    http_req_connecting: AggregatedMetric;
    http_req_sending: AggregatedMetric;
    http_req_waiting: AggregatedMetric;
    http_req_receiving: AggregatedMetric;
    iterations: AggregatedMetric;
    data_sent: { total: number; rate: number };
    data_received: { total: number; rate: number };
  };
  timeBuckets: TimeBucketData[];
  errors: ErrorSummary[];
  endpoints: EndpointSummary[];
}

interface TimeBucketData {
  startTime: string;
  endTime: string;
  requestCount: number;
  errorCount: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  throughput: number;
}

interface ErrorSummary {
  code: string;
  count: number;
  percentage: number;
  endpoint: string;
}

interface EndpointSummary {
  name: string;
  method: string;
  requestCount: number;
  errorCount: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
}

const BUCKET_SIZE_SECONDS = 10;
const SAMPLE_RATE = 1.0;
const KEEP_RAW_VALUES_THRESHOLD = 10000;

function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
}

function aggregateMetric(values: number[]): AggregatedMetric {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    count: values.length,
    sum: values.reduce((a, b) => a + b, 0),
    min: sorted[0] || 0,
    max: sorted[sorted.length - 1] || 0,
    avg: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
    p50: calculatePercentile(sorted, 50),
    p90: calculatePercentile(sorted, 90),
    p95: calculatePercentile(sorted, 95),
    p99: calculatePercentile(sorted, 99),
    values: sorted.length <= KEEP_RAW_VALUES_THRESHOLD ? sorted : [],
  };
}

async function processResultsFile(
  inputPath: string,
  outputDir: string,
  testName: string
): Promise<OptimizedResult> {
  console.log(`Processing: ${inputPath}`);
  console.log(`Output directory: ${outputDir}`);

  const stats = await fs.promises.stat(inputPath);
  const inputSizeGB = stats.size / (1024 * 1024 * 1024);
  console.log(`Input file size: ${inputSizeGB.toFixed(2)} GB`);

  const fileStream = fs.createReadStream(inputPath, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const metricValues = new Map<string, number[]>();
  const timeBuckets = new Map<number, TimeBucket>();
  const errors = new Map<string, { count: number; endpoint: string }>();
  const endpoints = new Map<
    string,
    {
      method: string;
      name: string;
      responseTimes: number[];
      errors: number;
    }
  >();

  let totalLines = 0;
  let totalPoints = 0;
  let startTime: Date | null = null;
  let endTime: Date | null = null;
  let totalRequests = 0;
  let totalIterations = 0;
  let totalErrors = 0;

  console.log('Reading and processing lines...');

  for await (const line of rl) {
    totalLines++;

    if (!line.trim()) continue;

    try {
      const data: K6Line = JSON.parse(line);

      if (data.type === 'Point') {
        totalPoints++;
        const point = data as MetricPoint;
        const metricName = point.metric;
        const value = point.data.value;
        const timestamp = new Date(point.data.time);

        if (!startTime || timestamp < startTime) startTime = timestamp;
        if (!endTime || timestamp > endTime) endTime = timestamp;

        if (!metricValues.has(metricName)) {
          metricValues.set(metricName, []);
        }
        metricValues.get(metricName)!.push(value);

        const bucketKey = Math.floor(timestamp.getTime() / (BUCKET_SIZE_SECONDS * 1000));
        if (!timeBuckets.has(bucketKey)) {
          timeBuckets.set(bucketKey, {
            startTime: new Date(bucketKey * BUCKET_SIZE_SECONDS * 1000),
            endTime: new Date((bucketKey + 1) * BUCKET_SIZE_SECONDS * 1000),
            metrics: new Map(),
            errorCount: 0,
            requestCount: 0,
          });
        }
        const bucket = timeBuckets.get(bucketKey)!;
        if (!bucket.metrics.has(metricName)) {
          bucket.metrics.set(metricName, []);
        }
        (bucket.metrics.get(metricName) as number[]).push(value);

        if (metricName === 'http_reqs') {
          totalRequests++;
          bucket.requestCount++;

          const url = point.data.tags.name || point.data.tags.url || 'unknown';
          const method = point.data.tags.method || 'GET';

          if (!endpoints.has(url)) {
            endpoints.set(url, { method, name: url, responseTimes: [], errors: 0 });
          }

          if (point.data.tags.status?.startsWith('4') || point.data.tags.status?.startsWith('5')) {
            const errorKey = `${point.data.tags.status}:${url}`;
            if (!errors.has(errorKey)) {
              errors.set(errorKey, { count: 0, endpoint: url });
            }
            errors.get(errorKey)!.count++;
            totalErrors++;
            bucket.errorCount++;
            endpoints.get(url)!.errors++;
          }
        }

        if (metricName === 'http_req_duration') {
          const url = point.data.tags.name || point.data.tags.url || 'unknown';
          if (endpoints.has(url)) {
            endpoints.get(url)!.responseTimes.push(value);
          }
        }

        if (metricName === 'iterations') {
          totalIterations++;
        }

        if (totalLines % 1000000 === 0) {
          console.log(
            `Processed ${totalLines.toLocaleString()} lines, ${totalPoints.toLocaleString()} data points...`
          );
        }
      }
    } catch (e) {
      // Skip malformed lines
    }
  }

  console.log(`\nTotal lines: ${totalLines.toLocaleString()}`);
  console.log(`Total data points: ${totalPoints.toLocaleString()}`);
  console.log(`Total requests: ${totalRequests.toLocaleString()}`);
  console.log(`Total iterations: ${totalIterations.toLocaleString()}`);
  console.log(`Total errors: ${totalErrors.toLocaleString()}`);

  console.log('\nAggregating metrics...');

  const summary: OptimizedResult['summary'] = {
    http_req_duration: aggregateMetric(metricValues.get('http_req_duration') || []),
    http_req_blocked: aggregateMetric(metricValues.get('http_req_blocked') || []),
    http_req_connecting: aggregateMetric(metricValues.get('http_req_connecting') || []),
    http_req_sending: aggregateMetric(metricValues.get('http_req_sending') || []),
    http_req_waiting: aggregateMetric(metricValues.get('http_req_waiting') || []),
    http_req_receiving: aggregateMetric(metricValues.get('http_req_receiving') || []),
    iterations: aggregateMetric(metricValues.get('iterations') || []),
    data_sent: {
      total: (metricValues.get('data_sent') || []).reduce((a, b) => a + b, 0),
      rate: 0,
    },
    data_received: {
      total: (metricValues.get('data_received') || []).reduce((a, b) => a + b, 0),
      rate: 0,
    },
  };

  const totalDuration = endTime && startTime ? (endTime.getTime() - startTime.getTime()) / 1000 : 0;
  summary.data_sent.rate = totalDuration > 0 ? summary.data_sent.total / totalDuration : 0;
  summary.data_received.rate = totalDuration > 0 ? summary.data_received.total / totalDuration : 0;

  console.log('\nProcessing time buckets...');
  const timeBucketData: TimeBucketData[] = [];
  const sortedBuckets = [...timeBuckets.entries()].sort((a, b) => a[0] - b[0]);

  for (const [_, bucket] of sortedBuckets) {
    const durations = bucket.metrics.get('http_req_duration') || [];
    const sortedDurations = [...durations].sort((a, b) => a - b);

    timeBucketData.push({
      startTime: bucket.startTime.toISOString(),
      endTime: bucket.endTime.toISOString(),
      requestCount: bucket.requestCount,
      errorCount: bucket.errorCount,
      avgResponseTime:
        durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      p95ResponseTime: calculatePercentile(sortedDurations, 95),
      throughput: BUCKET_SIZE_SECONDS > 0 ? bucket.requestCount / BUCKET_SIZE_SECONDS : 0,
    });
  }

  console.log('\nProcessing error summaries...');
  const errorSummary: ErrorSummary[] = [];
  for (const [key, data] of errors.entries()) {
    const [code] = key.split(':');
    errorSummary.push({
      code,
      count: data.count,
      percentage: totalRequests > 0 ? (data.count / totalRequests) * 100 : 0,
      endpoint: data.endpoint,
    });
  }
  errorSummary.sort((a, b) => b.count - a.count);

  console.log('\nProcessing endpoint summaries...');
  const endpointSummary: EndpointSummary[] = [];
  for (const [_, data] of endpoints.entries()) {
    const sorted = [...data.responseTimes].sort((a, b) => a - b);
    endpointSummary.push({
      name: data.name,
      method: data.method,
      requestCount: data.responseTimes.length,
      errorCount: data.errors,
      avgResponseTime: sorted.length > 0 ? sorted.reduce((a, b) => a + b, 0) / sorted.length : 0,
      p95ResponseTime: calculatePercentile(sorted, 95),
      minResponseTime: sorted[0] || 0,
      maxResponseTime: sorted[sorted.length - 1] || 0,
    });
  }
  endpointSummary.sort((a, b) => b.requestCount - a.requestCount);

  const result: OptimizedResult = {
    metadata: {
      testName,
      startTime: startTime?.toISOString() || '',
      endTime: endTime?.toISOString() || '',
      totalDuration,
      totalRequests,
      totalIterations,
      errorRate: totalRequests > 0 ? totalErrors / totalRequests : 0,
      bucketSizeSeconds: BUCKET_SIZE_SECONDS,
      compressionRatio: 0,
    },
    summary,
    timeBuckets: timeBucketData,
    errors: errorSummary.slice(0, 100),
    endpoints: endpointSummary.slice(0, 100),
  };

  await fs.promises.mkdir(outputDir, { recursive: true });

  console.log('\nWriting optimized results...');
  const summaryPath = path.join(outputDir, `${testName}-summary.json`);
  const summaryJson = JSON.stringify(result, null, 2);
  await fs.promises.writeFile(summaryPath, summaryJson);
  console.log(`Summary written to: ${summaryPath}`);

  console.log('\nWriting compressed time series data...');
  const timeSeriesPath = path.join(outputDir, `${testName}-timeseries.json.gz`);
  const timeSeriesData = JSON.stringify(timeBucketData);
  const compressed = zlib.gzipSync(timeSeriesData);
  await fs.promises.writeFile(timeSeriesPath, compressed);
  console.log(`Time series written to: ${timeSeriesPath}`);

  console.log('\nWriting endpoint details...');
  const endpointsPath = path.join(outputDir, `${testName}-endpoints.json.gz`);
  const endpointsCompressed = zlib.gzipSync(JSON.stringify(endpointSummary));
  await fs.promises.writeFile(endpointsPath, endpointsCompressed);
  console.log(`Endpoints written to: ${endpointsPath}`);

  const outputStats = await fs.promises.stat(summaryPath);
  const outputSizeMB = outputStats.size / (1024 * 1024);
  const compressedStats = await fs.promises.stat(timeSeriesPath);
  const compressedSizeMB = compressedStats.size / (1024 * 1024);

  result.metadata.compressionRatio =
    inputSizeGB > 0 ? (inputSizeGB * 1024) / (outputSizeMB + compressedSizeMB) : 0;

  console.log(`\n=== Optimization Complete ===`);
  console.log(`Original size: ${inputSizeGB.toFixed(2)} GB`);
  console.log(`Optimized size: ${(outputSizeMB + compressedSizeMB).toFixed(2)} MB`);
  console.log(`Compression ratio: ${result.metadata.compressionRatio.toFixed(2)}x`);
  console.log(
    `Space saved: ${((1 - (outputSizeMB + compressedSizeMB) / (inputSizeGB * 1024)) * 100).toFixed(1)}%`
  );

  return result;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: npx tsx k6/scripts/utils/optimize-k6-results.ts <input-file> [test-name]');
    console.log(
      'Example: npx tsx k6/scripts/utils/optimize-k6-results.ts k6/results/normal-load-results.json normal-load'
    );
    process.exit(1);
  }

  const inputPath = args[0];
  const testName = args[1] || path.basename(inputPath, '.json').replace('-results', '');
  const outputDir = path.join(path.dirname(inputPath), 'optimized');

  try {
    await processResultsFile(inputPath, outputDir, testName);
  } catch (error) {
    console.error('Error processing file:', error);
    process.exit(1);
  }
}

main();
