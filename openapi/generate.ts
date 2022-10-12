import * as fs from 'fs';
import * as path from 'path';

import { extendZodWithOpenApi, OpenAPIGenerator, ResponseConfig } from '@asteasolutions/zod-to-openapi';
import * as glob from 'glob';
import { z } from 'zod';

import { version } from '../package.json';
import { bearerAuth } from './components';
import { registry } from './registry';
import { OpenApiSpec } from './types';

extendZodWithOpenApi(z);

(async () => {
  const filenames = glob.sync('{,!(node_modules)/**/}*.openapi.ts');
  if (!filenames.length) {
    throw new Error('no API spec found');
  }

  for await (const filename of filenames) {
    const [functionJson, spec] = await Promise.all([
      import(`../${path.parse(filename).dir}/function.json`),
      import(`../${filename}`),
    ]);
    if (typeof spec.default === 'undefined') {
      throw new Error(`${filename} has no default export`);
    }
    const { route, method } = parseFunctionJson(functionJson);
    registerSpec(route, method, spec.default);
  }

  const generator = new OpenAPIGenerator(registry.definitions);

  try {
    const docs = generator.generateDocument({
      openapi: '3.0.0',
      info: {
        version,
        title: 'Generic asset API',
        description: 'This is just a showcase for a generic asset API',
      },
      servers: [{ url: 'http://localhost:7071/api' }],
      security: [{ [bearerAuth.name]: [] }],
    });

    const fileContent = JSON.stringify(docs, null, 2);

    fs.writeFileSync(`./open-api.json`, fileContent, {
      encoding: 'utf-8',
    });
  } catch (err) {
    console.error('Failed to generate document:', err);
    process.exit(1);
  }
})();

type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

interface HttpTriggerBinding {
  type: 'httpTrigger';
  route: 'string';
  methods: HttpMethod[];
}

function isHttpTriggerBinding(binding: HttpTriggerBinding | unknown): binding is HttpTriggerBinding {
  return (binding as HttpTriggerBinding).type === 'httpTrigger';
}

interface FunctionJson {
  bindings: Array<HttpTriggerBinding | unknown>;
}

function parseFunctionJson(functionJson: FunctionJson) {
  const httpTriggerBinding = functionJson.bindings.find(isHttpTriggerBinding);
  if (!httpTriggerBinding) {
    throw new Error(`no http trigger binding found in ${JSON.stringify(functionJson, null, 2)}`);
  }
  return {
    route: httpTriggerBinding.route,
    method: httpTriggerBinding.methods[0],
  };
}

function registerSpec(route: string, method: HttpMethod, spec: OpenApiSpec) {
  console.log(`adding documentation for ${method.toUpperCase()} ${route}`);
  // TODO verify that all route params match the spec params
  // TODO verify that requestBody is only defined when method is PUT, POST or PATCH

  const responses: {
    [statusCode: string]: ResponseConfig;
  } = {};

  if (!responses[401]) {
    responses[401] = {
      description: 'Not authorized',
    };
  }

  if (!responses[403] && spec.requiredPermissions?.length) {
    const description =
      spec.requiredPermissions.length === 1
        ? `Not allowed, user has no "${spec.requiredPermissions[0]}" permission`
        : `Not allowed, user is missing one of those permissions: ${spec.requiredPermissions
            .map((p) => `"${p}"`)
            .join(', ')}`;
    responses[403] = { description };
  }

  for (const [httpCode, x] of Object.entries(spec.responses)) {
    responses[httpCode] = {
      description: x.description,
      headers: x.headers,
      content: x.schema
        ? {
            'application/json': {
              schema: x.schema,
            },
          }
        : undefined,
    };
  }

  registry.registerPath({
    method,
    path: '/' + route,
    summary: spec.summary,
    description: spec.description,
    tags: [spec.tag],
    request: {
      params: spec.params ? z.object(spec.params) : undefined,
      query: spec.query,
      body: spec.requestBody
        ? {
            content: {
              'application/json': {
                schema: spec.requestBody,
              },
            },
            required: true,
          }
        : undefined,
    },
    responses,
  });
}
