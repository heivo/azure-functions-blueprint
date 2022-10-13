import * as path from 'path';

import { extendZodWithOpenApi, OpenAPIGenerator, ResponseConfig } from '@asteasolutions/zod-to-openapi';
import * as glob from 'glob';
import { z } from 'zod';

import { version } from '../package.json';
import { bearerAuth } from './components';
import { registry } from './registry';
import { OpenApiSpec } from './types';

export default async function generate(): Promise<string> {
  extendZodWithOpenApi(z);

  const filenames = glob.sync('{,!(node_modules)/**/}*.openapi.ts');
  if (!filenames.length) {
    throw new Error('No API spec found');
  }

  for await (const filename of filenames) {
    const [functionJson, spec] = await Promise.all([
      import(`../${path.parse(filename).dir}/function.json`),
      import(`../${filename}`),
    ]);
    if (typeof spec.default === 'undefined') {
      throw new Error(`${filename} has no default export`);
    } else if (typeof spec.default !== 'object') {
      throw new Error(`${filename} default export is not an object`);
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

    return JSON.stringify(docs, null, 2);
  } catch (err) {
    console.error('Failed to generate document:', err);
    process.exit(1);
  }
}

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
    throw new Error(`No http trigger binding found in ${JSON.stringify(functionJson, null, 2)}`);
  }
  return {
    route: httpTriggerBinding.route,
    method: httpTriggerBinding.methods[0],
  };
}

function registerSpec(route: string, method: HttpMethod, spec: OpenApiSpec) {
  console.log(`adding documentation for ${method.toUpperCase()} ${route}`);

  validateParams(route, spec.params);

  if (spec.requestBody && (method === 'get' || method === 'delete')) {
    throw new Error(`HTTP method "${method}" does not support a request body`);
  }

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

function validateParams(route: string, params: OpenApiSpec['params']) {
  const routeParams = [...route.matchAll(/{([^}]+)}/g)].map((m) => m[1]);
  if (routeParams.length) {
    if (!params) {
      throw new Error(`Route ${route} contains params but params are not defined in spec`);
    }
    for (const routeParam of routeParams) {
      if (!Object.keys(params).includes(routeParam)) {
        throw new Error(`Route param "${routeParam} is missing in spec`);
      }
    }
  }
  if (params) {
    for (const param of Object.keys(params)) {
      if (!routeParams.includes(param)) {
        throw new Error(`Param "${param}" is defined in spec but missing in route ${route}`);
      }
    }
  }
}
