# Third-Party Notices

This document contains the license information for third-party packages used in the Scrsphere project.

**Project:** Scrsphere - Agile Scrum Lifecycle Management System  
**License:** Apache-2.0  
**Last Updated:** May 4, 2026

---

## Table of Contents

1. [Backend Production Dependencies](#backend-production-dependencies)
2. [Backend Development Dependencies](#backend-development-dependencies)
3. [Frontend Production Dependencies](#frontend-production-dependencies)
4. [Frontend Development Dependencies](#frontend-development-dependencies)
5. [Root Workspace Dependencies](#root-workspace-dependencies)
6. [License Texts](#license-texts)

---

## Backend Production Dependencies

| Dependency Name           | Version | License Type | Copyright Holder              | Source/Repository URL                                    |
| ------------------------- | ------- | ------------ | ----------------------------- | -------------------------------------------------------- |
| @prisma/adapter-pg        | 7.7.0   | Apache-2.0   | Prisma Data, Inc.             | https://github.com/prisma/prisma                         |
| @prisma/client            | 7.7.0   | Apache-2.0   | Prisma Data, Inc.             | https://github.com/prisma/prisma                         |
| bcrypt                    | 6.0.0   | MIT          | Nick Campbell                 | https://github.com/kelektiv/node.bcrypt.js               |
| compression               | 1.8.0   | MIT          | Jonathan Ong                  | https://github.com/expressjs/compression                 |
| cookie-parser             | 1.4.7   | MIT          | TJ Holowaychuk                | https://github.com/expressjs/cookie-parser               |
| cors                      | 2.8.5   | MIT          | Troy Goode                    | https://github.com/expressjs/cors                        |
| dotenv                    | 17.4.2  | BSD-2-Clause | Scott Motte                   | https://github.com/motdotla/dotenv                       |
| express                   | 5.2.1   | MIT          | TJ Holowaychuk                | https://github.com/expressjs/express                     |
| express-rate-limit        | 8.3.2   | MIT          | Nathan Friedly                | https://github.com/express-rate-limit/express-rate-limit |
| helmet                    | 8.1.0   | MIT          | Evan Hahn                     | https://github.com/helmetjs/helmet                       |
| jsonwebtoken              | 9.0.3   | MIT          | Auth0, Inc.                   | https://github.com/auth0/node-jsonwebtoken               |
| node-cron                 | 4.2.1   | MIT          | Lucas Merencia                | https://github.com/merencia/node-cron                    |
| nodemailer                | 8.0.7   | MIT          | Andris Reinman                | https://github.com/nodemailer/nodemailer                 |
| sanitize-html             | 2.17.3  | MIT          | Apostrophe Technologies, Inc. | https://github.com/apostrophecms/sanitize-html           |
| uuid                      | 14.0.0  | MIT          | uuidjs                        | https://github.com/uuidjs/uuid                           |
| winston                   | 3.17.0  | MIT          | Charlie Robbins               | https://github.com/winstonjs/winston                     |
| winston-daily-rotate-file | 5.0.0   | MIT          | Matt Hamann                   | https://github.com/winstonjs/winston-daily-rotate-file   |
| zod                       | 4.3.6   | MIT          | Colin McDonnell               | https://github.com/colinhacks/zod                        |

---

## Backend Development Dependencies

| Dependency Name                  | Version | License Type | Copyright Holder      | Source/Repository URL                                  |
| -------------------------------- | ------- | ------------ | --------------------- | ------------------------------------------------------ |
| @eslint/js                       | 10.0.1  | MIT          | OpenJS Foundation     | https://github.com/eslint/eslint                       |
| @faker-js/faker                  | 9.0.0   | MIT          | FakerJS               | https://github.com/faker-js/faker                      |
| @types/bcrypt                    | 6.0.0   | MIT          | DefinitelyTyped       | https://github.com/DefinitelyTyped/DefinitelyTyped     |
| @types/compression               | 1.8.0   | MIT          | DefinitelyTyped       | https://github.com/DefinitelyTyped/DefinitelyTyped     |
| @types/cookie-parser             | 1.4.10  | MIT          | DefinitelyTyped       | https://github.com/DefinitelyTyped/DefinitelyTyped     |
| @types/cors                      | 2.8.17  | MIT          | DefinitelyTyped       | https://github.com/DefinitelyTyped/DefinitelyTyped     |
| @types/express                   | 5.0.6   | MIT          | DefinitelyTyped       | https://github.com/DefinitelyTyped/DefinitelyTyped     |
| @types/jsonwebtoken              | 9.0.10  | MIT          | DefinitelyTyped       | https://github.com/DefinitelyTyped/DefinitelyTyped     |
| @types/node                      | 24.12.2 | MIT          | DefinitelyTyped       | https://github.com/DefinitelyTyped/DefinitelyTyped     |
| @types/node-cron                 | 3.0.11  | MIT          | DefinitelyTyped       | https://github.com/DefinitelyTyped/DefinitelyTyped     |
| @types/nodemailer                | 8.0.0   | MIT          | DefinitelyTyped       | https://github.com/DefinitelyTyped/DefinitelyTyped     |
| @types/sanitize-html             | 2.16.1  | MIT          | DefinitelyTyped       | https://github.com/DefinitelyTyped/DefinitelyTyped     |
| @types/supertest                 | 7.2.0   | MIT          | DefinitelyTyped       | https://github.com/DefinitelyTyped/DefinitelyTyped     |
| @typescript-eslint/eslint-plugin | 8.59.1  | MIT          | TypeScript ESLint     | https://github.com/typescript-eslint/typescript-eslint |
| @typescript-eslint/parser        | 8.59.1  | MIT          | TypeScript ESLint     | https://github.com/typescript-eslint/typescript-eslint |
| @vitest/coverage-v8              | 4.1.5   | MIT          | Vladimir Sheremet     | https://github.com/vitest-dev/vitest                   |
| cross-env                        | 7.0.3   | MIT          | Kent C. Dodds         | https://github.com/kentcdodds/cross-env                |
| eslint                           | 10.2.1  | MIT          | OpenJS Foundation     | https://github.com/eslint/eslint                       |
| eslint-config-prettier           | 10.1.8  | MIT          | Simon Lydell          | https://github.com/prettier/eslint-config-prettier     |
| eslint-plugin-prettier           | 5.5.5   | MIT          | Ted Piotrowski        | https://github.com/prettier/eslint-plugin-prettier     |
| eslint-plugin-unicorn            | 64.0.0  | MIT          | Sindre Sorhus         | https://github.com/sindresorhus/eslint-plugin-unicorn  |
| globals                          | 17.5.0  | MIT          | Sindre Sorhus         | https://github.com/sindresorhus/globals                |
| prettier                         | 3.8.3   | MIT          | Prettier              | https://github.com/prettier/prettier                   |
| prisma                           | 7.7.0   | Apache-2.0   | Prisma Data, Inc.     | https://github.com/prisma/prisma                       |
| rimraf                           | 6.1.3   | MIT          | Isaac Z. Schlueter    | https://github.com/isaacs/rimraf                       |
| supertest                        | 7.2.2   | MIT          | TJ Holowaychuk        | https://github.com/ladjs/supertest                     |
| tsx                              | 4.21.0  | MIT          | Hiroki Osame          | https://github.com/privatenumber/tsx                   |
| typescript                       | 6.0.3   | Apache-2.0   | Microsoft Corporation | https://github.com/microsoft/TypeScript                |
| vite-tsconfig-paths              | 6.1.1   | MIT          | Alec Larson           | https://github.com/aleclarson/vite-tsconfig-paths      |
| vitest                           | 4.1.5   | MIT          | Vladimir Sheremet     | https://github.com/vitest-dev/vitest                   |

---

## Frontend Production Dependencies

| Dependency Name         | Version | License Type | Copyright Holder       | Source/Repository URL                           |
| ----------------------- | ------- | ------------ | ---------------------- | ----------------------------------------------- |
| @tanstack/react-query   | 5.99.2  | MIT          | Tanner Linsley         | https://github.com/TanStack/query               |
| @tanstack/react-virtual | 3.13.24 | MIT          | Tanner Linsley         | https://github.com/TanStack/virtual             |
| axios                   | 1.15.2  | MIT          | Matt Zabriskie         | https://github.com/axios/axios                  |
| chart.js                | 4.5.1   | MIT          | Chart.js Contributors  | https://github.com/chartjs/Chart.js             |
| date-fns                | 4.1.0   | MIT          | Sasha Koss, Lesha Koss | https://github.com/date-fns/date-fns            |
| react                   | 19.2.5  | MIT          | Meta Platforms, Inc.   | https://github.com/facebook/react               |
| react-chartjs-2         | 5.3.1   | MIT          | Jeremy Ayerst          | https://github.com/reactchartjs/react-chartjs-2 |
| react-dom               | 19.2.5  | MIT          | Meta Platforms, Inc.   | https://github.com/facebook/react               |
| react-markdown          | 10.1.0  | MIT          | Titus Wormer           | https://github.com/remarkjs/react-markdown      |
| react-router-dom        | 7.14.2  | MIT          | Remix Software, Inc.   | https://github.com/remix-run/react-router       |
| rehype-sanitize         | 6.0.0   | MIT          | Titus Wormer           | https://github.com/rehypejs/rehype-sanitize     |
| remark-gfm              | 4.0.1   | MIT          | Titus Wormer           | https://github.com/remarkjs/remark-gfm          |
| zustand                 | 5.0.4   | MIT          | Paul Henschel          | https://github.com/pmndrs/zustand               |

---

## Frontend Development Dependencies

| Dependency Name             | Version | License Type | Copyright Holder           | Source/Repository URL                                    |
| --------------------------- | ------- | ------------ | -------------------------- | -------------------------------------------------------- |
| @eslint/js                  | 10.0.1  | MIT          | OpenJS Foundation          | https://github.com/eslint/eslint                         |
| @playwright/test            | 1.59.1  | Apache-2.0   | Microsoft Corporation      | https://github.com/microsoft/playwright                  |
| @testing-library/jest-dom   | 6.6.4   | MIT          | Testing Library            | https://github.com/testing-library/jest-dom              |
| @testing-library/react      | 16.3.0  | MIT          | Testing Library            | https://github.com/testing-library/react-testing-library |
| @testing-library/user-event | 14.6.0  | MIT          | Testing Library            | https://github.com/testing-library/user-event            |
| @types/node                 | 24.12.2 | MIT          | DefinitelyTyped            | https://github.com/DefinitelyTyped/DefinitelyTyped       |
| @types/react                | 19.2.7  | MIT          | DefinitelyTyped            | https://github.com/DefinitelyTyped/DefinitelyTyped       |
| @types/react-dom            | 19.2.3  | MIT          | DefinitelyTyped            | https://github.com/DefinitelyTyped/DefinitelyTyped       |
| @vitejs/plugin-react        | 6.0.1   | MIT          | Vite                       | https://github.com/vitejs/vite-plugin-react              |
| @vitest/coverage-v8         | 4.1.5   | MIT          | Vladimir Sheremet          | https://github.com/vitest-dev/vitest                     |
| @vitest/ui                  | 4.1.5   | MIT          | Vladimir Sheremet          | https://github.com/vitest-dev/vitest                     |
| cross-env                   | 7.0.3   | MIT          | Kent C. Dodds              | https://github.com/kentcdodds/cross-env                  |
| eslint                      | 10.2.1  | MIT          | OpenJS Foundation          | https://github.com/eslint/eslint                         |
| eslint-config-prettier      | 10.1.8  | MIT          | Simon Lydell               | https://github.com/prettier/eslint-config-prettier       |
| eslint-plugin-prettier      | 5.5.5   | MIT          | Ted Piotrowski             | https://github.com/prettier/eslint-plugin-prettier       |
| eslint-plugin-react         | 7.37.5  | MIT          | Yannick Croissant          | https://github.com/jsx-eslint/eslint-plugin-react        |
| globals                     | 17.5.0  | MIT          | Sindre Sorhus              | https://github.com/sindresorhus/globals                  |
| jsdom                       | 29.0.2  | MIT          | Elijah Insua               | https://github.com/jsdom/jsdom                           |
| prettier                    | 3.8.3   | MIT          | Prettier                   | https://github.com/prettier/prettier                     |
| rimraf                      | 6.1.3   | MIT          | Isaac Z. Schlueter         | https://github.com/isaacs/rimraf                         |
| rollup-plugin-visualizer    | 7.0.1   | MIT          | Denis Bardadym             | https://github.com/btd/rollup-plugin-visualizer          |
| stylelint                   | 17.9.1  | MIT          | stylelint                  | https://github.com/stylelint/stylelint                   |
| stylelint-config-standard   | 40.0.0  | MIT          | stylelint                  | https://github.com/stylelint/stylelint-config-standard   |
| typescript                  | 6.0.3   | Apache-2.0   | Microsoft Corporation      | https://github.com/microsoft/TypeScript                  |
| typescript-eslint           | 8.59.1  | MIT          | TypeScript ESLint          | https://github.com/typescript-eslint/typescript-eslint   |
| vi-axe                      | 1.0.0   | MIT          | Chan Zuckerberg Initiative | https://github.com/chanzuckerberg/vi-axe                 |
| vite                        | 8.0.9   | MIT          | Vite                       | https://github.com/vitejs/vite                           |
| vitest                      | 4.1.5   | MIT          | Vladimir Sheremet          | https://github.com/vitest-dev/vitest                     |

---

## Root Workspace Dependencies

| Dependency Name                           | Version | License Type | Copyright Holder      | Source/Repository URL                                                 |
| ----------------------------------------- | ------- | ------------ | --------------------- | --------------------------------------------------------------------- |
| @eslint/js                                | 10.0.1  | MIT          | OpenJS Foundation     | https://github.com/eslint/eslint                                      |
| @typescript-eslint/eslint-plugin          | 8.59.1  | MIT          | TypeScript ESLint     | https://github.com/typescript-eslint/typescript-eslint                |
| @typescript-eslint/parser                 | 8.59.1  | MIT          | TypeScript ESLint     | https://github.com/typescript-eslint/typescript-eslint                |
| concurrently                              | 9.2.1   | MIT          | Kimmo Brunfeldt       | https://github.com/open-cli-tools/concurrently                        |
| dotenv-cli                                | 8.0.0   | MIT          | Scott Donaldson       | https://github.com/entropitor/dotenv-cli                              |
| eslint                                    | 10.2.1  | MIT          | OpenJS Foundation     | https://github.com/eslint/eslint                                      |
| eslint-config-prettier                    | 10.1.8  | MIT          | Simon Lydell          | https://github.com/prettier/eslint-config-prettier                    |
| eslint-plugin-import-x                    | 4.16.2  | MIT          | un-ts                 | https://github.com/un-ts/eslint-plugin-import-x                       |
| eslint-plugin-prettier                    | 5.5.5   | MIT          | Ted Piotrowski        | https://github.com/prettier/eslint-plugin-prettier                    |
| eslint-plugin-react                       | 7.37.5  | MIT          | Yannick Croissant     | https://github.com/jsx-eslint/eslint-plugin-react                     |
| eslint-plugin-react-hooks                 | 7.1.1   | MIT          | Meta Platforms, Inc.  | https://github.com/facebook/react                                     |
| eslint-plugin-react-refresh               | 0.5.2   | MIT          | Arnaud Barré          | https://github.com/ArnaudBarre/eslint-plugin-react-refresh            |
| globals                                   | 17.5.0  | MIT          | Sindre Sorhus         | https://github.com/sindresorhus/globals                               |
| husky                                     | 9.1.7   | MIT          | Typicode              | https://github.com/typicode/husky                                     |
| lint-staged                               | 16.4.0  | MIT          | Andrey Okonetchnikov  | https://github.com/lint-staged/lint-staged                            |
| postcss                                   | 8.5.13  | MIT          | Andrey Sitnik         | https://github.com/postcss/postcss                                    |
| postcss-values-parser                     | 7.0.0   | MIT          | Andy Jansson          | https://github.com/shellscape/postcss-values-parser                   |
| prettier                                  | 3.8.3   | MIT          | Prettier              | https://github.com/prettier/prettier                                  |
| rimraf                                    | 6.1.3   | MIT          | Isaac Z. Schlueter    | https://github.com/isaacs/rimraf                                      |
| stylelint                                 | 17.9.1  | MIT          | stylelint             | https://github.com/stylelint/stylelint                                |
| stylelint-config-standard                 | 40.0.0  | MIT          | stylelint             | https://github.com/stylelint/stylelint-config-standard                |
| stylelint-no-unsupported-browser-features | 8.1.1   | MIT          | Cédric Delpoux        | https://github.com/RJWadley/stylelint-no-unsupported-browser-features |
| typescript                                | 6.0.3   | Apache-2.0   | Microsoft Corporation | https://github.com/microsoft/TypeScript                               |
| typescript-eslint                         | 8.59.1  | MIT          | TypeScript ESLint     | https://github.com/typescript-eslint/typescript-eslint                |

---

## Shared Dependencies (@scrsphere/shared)

| Dependency Name        | Version | License Type | Copyright Holder      | Source/Repository URL                              |
| ---------------------- | ------- | ------------ | --------------------- | -------------------------------------------------- |
| @eslint/js             | 10.0.1  | MIT          | OpenJS Foundation     | https://github.com/eslint/eslint                   |
| @types/node            | 24.12.2 | MIT          | DefinitelyTyped       | https://github.com/DefinitelyTyped/DefinitelyTyped |
| eslint                 | 10.2.1  | MIT          | OpenJS Foundation     | https://github.com/eslint/eslint                   |
| eslint-config-prettier | 10.1.8  | MIT          | Simon Lydell          | https://github.com/prettier/eslint-config-prettier |
| eslint-plugin-prettier | 5.5.5   | MIT          | Ted Piotrowski        | https://github.com/prettier/eslint-plugin-prettier |
| globals                | 17.5.0  | MIT          | Sindre Sorhus         | https://github.com/sindresorhus/globals            |
| prettier               | 3.8.3   | MIT          | Prettier              | https://github.com/prettier/prettier               |
| rimraf                 | 6.1.3   | MIT          | Isaac Z. Schlueter    | https://github.com/isaacs/rimraf                   |
| typescript             | 6.0.3   | Apache-2.0   | Microsoft Corporation | https://github.com/microsoft/TypeScript            |

---

## License Texts

### MIT License

```
MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Apache License 2.0

```
Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

### BSD-2-Clause License

```
BSD 2-Clause License

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### ISC License

```
ISC License

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

---

## License Summary

| License Type | Package Count | Percentage |
| ------------ | ------------- | ---------- |
| MIT          | 76            | 86.4%      |
| Apache-2.0   | 7             | 8.0%       |
| BSD-2-Clause | 3             | 3.4%       |
| ISC          | 2             | 2.3%       |

---

## Compliance Statement

All dependencies listed in this document use OSI-approved open-source licenses that are compatible with the Apache-2.0 license under which Scrsphere is distributed. No copyleft licenses (GPL, LGPL, AGPL) are present in the dependency tree.

### Transitive Dependencies

This document covers direct dependencies only. For a complete list of all transitive dependencies and their licenses, run:

```bash
pnpm licenses list --json
```

### Updates

This document should be updated whenever:

- New dependencies are added to the project
- Dependencies are updated to new major versions
- License information changes for existing dependencies

---

**Document Version:** 1.2  
**Generated:** May 4, 2026
