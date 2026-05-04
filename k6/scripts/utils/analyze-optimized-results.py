#!/usr/bin/env python3
"""
Analyze optimized k6 load test results and generate reports.
"""

import json
import gzip
import sys
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional
import argparse


def load_json_file(filepath: str) -> Any:
    """Load JSON file, handling gzip compression."""
    if filepath.endswith('.gz'):
        with gzip.open(filepath, 'rt', encoding='utf-8') as f:
            return json.load(f)
    else:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)


def format_bytes(bytes_val: int) -> str:
    """Format bytes to human readable string."""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes_val < 1024.0:
            return f"{bytes_val:.2f} {unit}"
        bytes_val /= 1024.0
    return f"{bytes_val:.2f} PB"


def format_duration(seconds: float) -> str:
    """Format seconds to human readable duration."""
    if seconds < 60:
        return f"{seconds:.1f}s"
    elif seconds < 3600:
        minutes = seconds / 60
        return f"{minutes:.1f}m"
    else:
        hours = seconds / 3600
        return f"{hours:.1f}h"


def analyze_summary(data: Dict) -> Dict[str, Any]:
    """Analyze summary data and return key insights."""
    metadata = data.get('metadata', {})
    summary = data.get('summary', {})
    
    analysis = {
        'test_info': {
            'name': metadata.get('testName', 'Unknown'),
            'start_time': metadata.get('startTime', ''),
            'end_time': metadata.get('endTime', ''),
            'duration': format_duration(metadata.get('totalDuration', 0)),
        },
        'request_stats': {
            'total_requests': metadata.get('totalRequests', 0),
            'total_iterations': metadata.get('totalIterations', 0),
            'error_rate': f"{metadata.get('errorRate', 0) * 100:.2f}%",
        },
        'response_time': {
            'avg': f"{summary.get('http_req_duration', {}).get('avg', 0):.2f}ms",
            'p50': f"{summary.get('http_req_duration', {}).get('p50', 0):.2f}ms",
            'p90': f"{summary.get('http_req_duration', {}).get('p90', 0):.2f}ms",
            'p95': f"{summary.get('http_req_duration', {}).get('p95', 0):.2f}ms",
            'p99': f"{summary.get('http_req_duration', {}).get('p99', 0):.2f}ms",
            'min': f"{summary.get('http_req_duration', {}).get('min', 0):.2f}ms",
            'max': f"{summary.get('http_req_duration', {}).get('max', 0):.2f}ms",
        },
        'throughput': {
            'data_sent': format_bytes(summary.get('data_sent', {}).get('total', 0)),
            'data_received': format_bytes(summary.get('data_received', {}).get('total', 0)),
            'send_rate': f"{summary.get('data_sent', {}).get('rate', 0) / 1024:.2f} KB/s",
            'receive_rate': f"{summary.get('data_received', {}).get('rate', 0) / 1024:.2f} KB/s",
        },
        'performance_grade': calculate_performance_grade(data),
    }
    
    return analysis


def calculate_performance_grade(data: Dict) -> Dict[str, str]:
    """Calculate performance grade based on metrics."""
    summary = data.get('summary', {})
    metadata = data.get('metadata', {})
    
    grades = {}
    
    error_rate = metadata.get('errorRate', 1)
    if error_rate < 0.01:
        grades['error_rate'] = 'A (Excellent)'
    elif error_rate < 0.05:
        grades['error_rate'] = 'B (Good)'
    elif error_rate < 0.10:
        grades['error_rate'] = 'C (Acceptable)'
    else:
        grades['error_rate'] = 'F (Poor)'
    
    p95 = summary.get('http_req_duration', {}).get('p95', float('inf'))
    if p95 < 200:
        grades['response_time'] = 'A (Excellent)'
    elif p95 < 500:
        grades['response_time'] = 'B (Good)'
    elif p95 < 1000:
        grades['response_time'] = 'C (Acceptable)'
    elif p95 < 2000:
        grades['response_time'] = 'D (Slow)'
    else:
        grades['response_time'] = 'F (Poor)'
    
    return grades


def analyze_time_buckets(buckets: List[Dict]) -> Dict[str, Any]:
    """Analyze time bucket data for trends."""
    if not buckets:
        return {'error': 'No time bucket data available'}
    
    request_counts = [b.get('requestCount', 0) for b in buckets]
    error_counts = [b.get('errorCount', 0) for b in buckets]
    avg_response_times = [b.get('avgResponseTime', 0) for b in buckets]
    p95_response_times = [b.get('p95ResponseTime', 0) for b in buckets]
    
    analysis = {
        'time_range': {
            'start': buckets[0].get('startTime', ''),
            'end': buckets[-1].get('endTime', ''),
            'bucket_count': len(buckets),
        },
        'request_trends': {
            'min': min(request_counts),
            'max': max(request_counts),
            'avg': sum(request_counts) / len(request_counts),
            'total': sum(request_counts),
        },
        'error_trends': {
            'buckets_with_errors': sum(1 for e in error_counts if e > 0),
            'max_errors_in_bucket': max(error_counts),
            'total_errors': sum(error_counts),
        },
        'response_time_trends': {
            'min_avg': min(avg_response_times),
            'max_avg': max(avg_response_times),
            'min_p95': min(p95_response_times),
            'max_p95': max(p95_response_times),
        },
        'peak_period': identify_peak_period(buckets),
        'degradation_periods': identify_degradation(buckets),
    }
    
    return analysis


def identify_peak_period(buckets: List[Dict]) -> Dict[str, Any]:
    """Identify peak load period."""
    if not buckets:
        return {}
    
    max_requests = 0
    peak_bucket = None
    
    for bucket in buckets:
        if bucket.get('requestCount', 0) > max_requests:
            max_requests = bucket.get('requestCount', 0)
            peak_bucket = bucket
    
    if peak_bucket:
        return {
            'start_time': peak_bucket.get('startTime', ''),
            'end_time': peak_bucket.get('endTime', ''),
            'request_count': max_requests,
            'avg_response_time': f"{peak_bucket.get('avgResponseTime', 0):.2f}ms",
        }
    
    return {}


def identify_degradation(buckets: List[Dict]) -> List[Dict]:
    """Identify periods of performance degradation."""
    degradations = []
    
    for i, bucket in enumerate(buckets):
        p95 = bucket.get('p95ResponseTime', 0)
        if p95 > 1000:
            degradations.append({
                'start_time': bucket.get('startTime', ''),
                'end_time': bucket.get('endTime', ''),
                'p95_response_time': f"{p95:.2f}ms",
                'request_count': bucket.get('requestCount', 0),
                'error_count': bucket.get('errorCount', 0),
            })
    
    return degradations[:10]


def analyze_errors(errors: List[Dict]) -> Dict[str, Any]:
    """Analyze error patterns."""
    if not errors:
        return {'total_errors': 0, 'error_types': []}
    
    total = sum(e.get('count', 0) for e in errors)
    
    error_by_code = {}
    error_by_endpoint = {}
    
    for error in errors:
        code = error.get('code', 'unknown')
        endpoint = error.get('endpoint', 'unknown')
        count = error.get('count', 0)
        
        if code not in error_by_code:
            error_by_code[code] = 0
        error_by_code[code] += count
        
        if endpoint not in error_by_endpoint:
            error_by_endpoint[endpoint] = 0
        error_by_endpoint[endpoint] += count
    
    return {
        'total_errors': total,
        'unique_error_codes': len(error_by_code),
        'affected_endpoints': len(error_by_endpoint),
        'error_by_code': [
            {'code': k, 'count': v, 'percentage': f"{(v/total)*100:.1f}%"}
            for k, v in sorted(error_by_code.items(), key=lambda x: x[1], reverse=True)
        ][:10],
        'top_error_endpoints': [
            {'endpoint': k, 'count': v}
            for k, v in sorted(error_by_endpoint.items(), key=lambda x: x[1], reverse=True)
        ][:10],
    }


def analyze_endpoints(endpoints: List[Dict]) -> Dict[str, Any]:
    """Analyze endpoint performance."""
    if not endpoints:
        return {'total_endpoints': 0}
    
    slow_endpoints = [e for e in endpoints if e.get('avgResponseTime', 0) > 500]
    error_prone = [e for e in endpoints if e.get('errorCount', 0) > 0]
    
    return {
        'total_endpoints': len(endpoints),
        'total_requests': sum(e.get('requestCount', 0) for e in endpoints),
        'slow_endpoints': [
            {
                'name': e.get('name', ''),
                'method': e.get('method', ''),
                'avg_response_time': f"{e.get('avgResponseTime', 0):.2f}ms",
                'p95_response_time': f"{e.get('p95ResponseTime', 0):.2f}ms",
            }
            for e in sorted(slow_endpoints, key=lambda x: x.get('avgResponseTime', 0), reverse=True)
        ][:10],
        'error_prone_endpoints': [
            {
                'name': e.get('name', ''),
                'method': e.get('method', ''),
                'error_count': e.get('errorCount', 0),
                'request_count': e.get('requestCount', 0),
                'error_rate': f"{(e.get('errorCount', 0) / max(e.get('requestCount', 1), 1)) * 100:.2f}%",
            }
            for e in sorted(error_prone, key=lambda x: x.get('errorCount', 0), reverse=True)
        ][:10],
        'most_used_endpoints': [
            {
                'name': e.get('name', ''),
                'method': e.get('method', ''),
                'request_count': e.get('requestCount', 0),
                'avg_response_time': f"{e.get('avgResponseTime', 0):.2f}ms",
            }
            for e in sorted(endpoints, key=lambda x: x.get('requestCount', 0), reverse=True)
        ][:10],
    }


def generate_report(summary_path: str, output_format: str = 'text') -> str:
    """Generate analysis report."""
    data = load_json_file(summary_path)
    
    analysis = {
        'summary': analyze_summary(data),
        'time_analysis': analyze_time_buckets(data.get('timeBuckets', [])),
        'error_analysis': analyze_errors(data.get('errors', [])),
        'endpoint_analysis': analyze_endpoints(data.get('endpoints', [])),
    }
    
    if output_format == 'json':
        return json.dumps(analysis, indent=2)
    
    report = []
    report.append("=" * 80)
    report.append("K6 LOAD TEST ANALYSIS REPORT")
    report.append("=" * 80)
    report.append("")
    
    summary = analysis['summary']
    report.append("TEST SUMMARY")
    report.append("-" * 40)
    report.append(f"Test Name: {summary['test_info']['name']}")
    report.append(f"Duration: {summary['test_info']['duration']}")
    report.append(f"Total Requests: {summary['request_stats']['total_requests']:,}")
    report.append(f"Total Iterations: {summary['request_stats']['total_iterations']:,}")
    report.append(f"Error Rate: {summary['request_stats']['error_rate']}")
    report.append("")
    
    report.append("RESPONSE TIME METRICS")
    report.append("-" * 40)
    for key, value in summary['response_time'].items():
        report.append(f"  {key.upper()}: {value}")
    report.append("")
    
    report.append("PERFORMANCE GRADES")
    report.append("-" * 40)
    for key, value in summary['performance_grade'].items():
        report.append(f"  {key.replace('_', ' ').title()}: {value}")
    report.append("")
    
    report.append("THROUGHPUT")
    report.append("-" * 40)
    report.append(f"  Data Sent: {summary['throughput']['data_sent']}")
    report.append(f"  Data Received: {summary['throughput']['data_received']}")
    report.append(f"  Send Rate: {summary['throughput']['send_rate']}")
    report.append(f"  Receive Rate: {summary['throughput']['receive_rate']}")
    report.append("")
    
    time_analysis = analysis['time_analysis']
    report.append("TIME-BASED ANALYSIS")
    report.append("-" * 40)
    report.append(f"  Bucket Count: {time_analysis['time_range']['bucket_count']}")
    report.append(f"  Request Range: {time_analysis['request_trends']['min']} - {time_analysis['request_trends']['max']}")
    report.append(f"  Avg Requests/Bucket: {time_analysis['request_trends']['avg']:.0f}")
    
    if time_analysis.get('peak_period'):
        peak = time_analysis['peak_period']
        report.append(f"  Peak Period: {peak['start_time']}")
        report.append(f"    Requests: {peak['request_count']}")
        report.append(f"    Avg Response Time: {peak['avg_response_time']}")
    report.append("")
    
    error_analysis = analysis['error_analysis']
    if error_analysis['total_errors'] > 0:
        report.append("ERROR ANALYSIS")
        report.append("-" * 40)
        report.append(f"  Total Errors: {error_analysis['total_errors']:,}")
        report.append(f"  Unique Error Codes: {error_analysis['unique_error_codes']}")
        report.append(f"  Affected Endpoints: {error_analysis['affected_endpoints']}")
        report.append("")
        report.append("  Top Error Codes:")
        for err in error_analysis['error_by_code'][:5]:
            report.append(f"    {err['code']}: {err['count']} ({err['percentage']})")
        report.append("")
    
    endpoint_analysis = analysis['endpoint_analysis']
    report.append("ENDPOINT ANALYSIS")
    report.append("-" * 40)
    report.append(f"  Total Endpoints: {endpoint_analysis['total_endpoints']}")
    report.append(f"  Total Requests: {endpoint_analysis['total_requests']:,}")
    
    if endpoint_analysis['slow_endpoints']:
        report.append("")
        report.append("  Slow Endpoints (avg > 500ms):")
        for ep in endpoint_analysis['slow_endpoints'][:5]:
            report.append(f"    {ep['method']} {ep['name']}: {ep['avg_response_time']}")
    
    if endpoint_analysis['error_prone_endpoints']:
        report.append("")
        report.append("  Error-Prone Endpoints:")
        for ep in endpoint_analysis['error_prone_endpoints'][:5]:
            report.append(f"    {ep['method']} {ep['name']}: {ep['error_count']} errors ({ep['error_rate']})")
    report.append("")
    
    degradation = time_analysis.get('degradation_periods', [])
    if degradation:
        report.append("PERFORMANCE DEGRADATION PERIODS")
        report.append("-" * 40)
        for d in degradation[:5]:
            report.append(f"  {d['start_time']}:")
            report.append(f"    P95 Response Time: {d['p95_response_time']}")
            report.append(f"    Requests: {d['request_count']}, Errors: {d['error_count']}")
        report.append("")
    
    report.append("=" * 80)
    report.append(f"Report generated at: {datetime.now().isoformat()}")
    report.append("=" * 80)
    
    return "\n".join(report)


def main():
    parser = argparse.ArgumentParser(description='Analyze optimized k6 load test results')
    parser.add_argument('summary_file', help='Path to the summary JSON file')
    parser.add_argument('--format', choices=['text', 'json'], default='text',
                        help='Output format (default: text)')
    parser.add_argument('--output', '-o', help='Output file path (default: stdout)')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.summary_file):
        print(f"Error: File not found: {args.summary_file}", file=sys.stderr)
        sys.exit(1)
    
    report = generate_report(args.summary_file, args.format)
    
    if args.output:
        with open(args.output, 'w') as f:
            f.write(report)
        print(f"Report written to: {args.output}")
    else:
        print(report)


if __name__ == '__main__':
    main()
