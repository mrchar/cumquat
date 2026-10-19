import type { ResourceSchema } from '../../resources/types';

/**
 * 完整 OpenAPI 3.0 测试文档：
 * - users：全 CRUD，信封分页（records/total），page/pageSize/keyword 命名，status 枚举筛选
 * - orders：只读（list/detail/remove），current/size/sortBy 命名，items/total 信封
 * 覆盖：$ref 引用、路径级 + 操作级参数、路径占位符、format 映射、非原始类型跳过、required
 */
export const openApiDoc = {
  openapi: '3.0.3',
  info: { title: '用户中心', version: '1.0.0' },
  servers: [{ url: 'https://api.example.com/v1' }],
  paths: {
    '/users': {
      get: {
        tags: ['users'],
        summary: '用户列表',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer' } },
          { name: 'keyword', in: 'query', schema: { type: 'string' } },
          {
            name: 'status',
            in: 'query',
            description: '按状态筛选',
            schema: { type: 'string', enum: ['active', 'disabled'] },
          },
        ],
        responses: {
          '200': {
            description: '分页结果',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/UserPage' } } },
          },
        },
      },
      post: {
        tags: ['users'],
        summary: '创建用户',
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UserInput' } } },
        },
        responses: {
          '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
        },
      },
    },
    '/users/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      get: {
        tags: ['users'],
        summary: '用户详情',
        responses: {
          '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
        },
      },
      put: {
        tags: ['users'],
        summary: '更新用户',
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UserInput' } } },
        },
        responses: {
          '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
        },
      },
      delete: {
        tags: ['users'],
        summary: '删除用户',
        responses: { '204': { description: '删除成功' } },
      },
    },
    '/orders': {
      get: {
        tags: ['orders'],
        summary: '订单列表',
        parameters: [
          { name: 'current', in: 'query', schema: { type: 'integer' } },
          { name: 'size', in: 'query', schema: { type: 'integer' } },
          { name: 'sortBy', in: 'query', schema: { type: 'string' } },
          {
            name: 'status',
            in: 'query',
            description: '订单状态',
            schema: { type: 'integer', enum: [0, 1, 2] },
          },
        ],
        responses: {
          '200': {
            description: '分页结果',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: { type: 'array', items: { $ref: '#/components/schemas/Order' } },
                    total: { type: 'integer', description: '总数' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/orders/{id}': {
      get: {
        tags: ['orders'],
        summary: '订单详情',
        responses: {
          '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/Order' } } } },
        },
      },
      delete: {
        tags: ['orders'],
        summary: '取消订单',
        responses: { '204': { description: '已取消' } },
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: { type: 'integer', description: '用户ID' },
          name: { type: 'string', description: '姓名' },
          email: { type: 'string', format: 'email', description: '邮箱' },
          status: { type: 'string', enum: ['active', 'disabled'], description: '状态' },
          createdAt: { type: 'string', format: 'date-time', description: '创建时间' },
          birthday: { type: 'string', format: 'date', description: '生日' },
          active: { type: 'boolean', description: '是否启用' },
          score: { type: 'number', format: 'int64', description: '积分' },
          website: { type: 'string', format: 'uri', description: '主页' },
          profile: { type: 'object', description: '扩展信息' },
        },
      },
      UserInput: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', description: '姓名' },
          email: { type: 'string', description: '邮箱' },
          status: { type: 'string', enum: ['active', 'disabled'], description: '状态' },
        },
      },
      UserPage: {
        type: 'object',
        properties: {
          records: { type: 'array', items: { $ref: '#/components/schemas/User' } },
          total: { type: 'integer', description: '总数' },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          amount: { type: 'number', description: '金额' },
          status: { type: 'integer', enum: [0, 1, 2], description: '订单状态' },
        },
      },
    },
  },
} as const;

/**
 * Swagger 2.0 测试文档：pets（body 参数、definitions 引用、host/basePath、
 * 路径级 petId 参数、limit/size 命名、kind 枚举筛选）
 */
export const swaggerDoc = {
  swagger: '2.0',
  info: { title: '宠物商店', version: '1.0.0' },
  host: 'petstore.example.com',
  basePath: '/api',
  paths: {
    '/pets': {
      get: {
        tags: ['pets'],
        summary: '宠物列表',
        parameters: [
          { name: 'page', in: 'query', type: 'integer' },
          { name: 'limit', in: 'query', type: 'integer' },
          { name: 'kind', in: 'query', type: 'string', enum: ['cat', 'dog'] },
        ],
        responses: {
          '200': { description: '分页结果', schema: { $ref: '#/definitions/PetPage' } },
        },
      },
      post: {
        tags: ['pets'],
        summary: '新增宠物',
        parameters: [
          { name: 'body', in: 'body', schema: { $ref: '#/definitions/PetInput' } },
        ],
        responses: { '200': { description: '成功', schema: { $ref: '#/definitions/Pet' } } },
      },
    },
    '/pets/{petId}': {
      parameters: [{ name: 'petId', in: 'path', required: true, type: 'integer' }],
      get: {
        tags: ['pets'],
        summary: '宠物详情',
        responses: { '200': { description: '成功', schema: { $ref: '#/definitions/Pet' } } },
      },
      delete: {
        tags: ['pets'],
        summary: '删除宠物',
        responses: { '204': { description: '成功' } },
      },
    },
  },
  definitions: {
    Pet: {
      type: 'object',
      required: ['id', 'name'],
      properties: {
        id: { type: 'integer', description: '宠物ID' },
        name: { type: 'string', description: '名字' },
        kind: { type: 'string', enum: ['cat', 'dog'], description: '种类' },
        homepage: { type: 'string', format: 'uri', description: '主页' },
        tags: { type: 'array', items: { type: 'string' }, description: '标签' },
        owner: { type: 'object', description: '主人' },
      },
    },
    PetInput: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', description: '名字' },
        kind: { type: 'string', enum: ['cat', 'dog'], description: '种类' },
      },
    },
    PetPage: {
      type: 'object',
      properties: {
        records: { type: 'array', items: { $ref: '#/definitions/Pet' } },
        total: { type: 'integer', description: '总数' },
      },
    },
  },
} as const;

/** 直接传 schema 的池测试样例 */
export const userSchema: ResourceSchema = {
  resources: {
    users: {
      list: { method: 'GET', path: '/users' },
      detail: { method: 'GET', path: '/users/{id}' },
      create: { method: 'POST', path: '/users' },
      update: { method: 'PUT', path: '/users/{id}' },
      remove: { method: 'DELETE', path: '/users/{id}' },
      queryNames: { currentPage: 'pageNo' },
      response: { list: 'records', total: 'total' },
      fields: [
        { name: 'id', label: 'ID', type: 'number', scope: { list: true } },
        {
          name: 'name',
          label: '姓名',
          type: 'string',
          required: true,
          scope: { list: true, create: true, update: true },
        },
        {
          name: 'status',
          label: '状态',
          type: 'enum',
          options: [{ label: '启用', value: 1 }],
          scope: { list: true, filter: true },
        },
      ],
    },
  },
};
