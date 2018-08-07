import { mapValues, reduce, isUndefined, isNull, isEmpty } from 'lodash';

const noop = v => v;

export enum FieldType {
  string = 'string',
  boolean = 'boolean',
  float = 'float',
  integer = 'integer'
}

const transforms = {
  [FieldType.string]: toString,
  [FieldType.boolean]: v => v === 'true',
  [FieldType.float]: parseFloat,
  [FieldType.integer]: parseInt
};

export interface SchemaType {
  [key: string]: {
    type?: FieldType,
    serialize?: any,
    deserialize?: any
  };
}

export class Attributes {
  private schema: SchemaType;
  private data: any;
  constructor({
    data,
    keycloakAttr,
    schema
  }: {
    data?: Record<string, any>,
    keycloakAttr?: Record<string, any[]>,
    schema?: SchemaType
  }) {
    this.schema = schema;
    if (data) {
      this.data = data;
    } else if (keycloakAttr) {
      this.data = this.transformKeycloakAttr(keycloakAttr);
    }
  }

  public mergeWithKeycloakAttrs(keycloakAttr?: Record<string, any[]>) {
    const attr = this.transformKeycloakAttr(keycloakAttr);
    const data = this.data || {};
    this.data = {
      ...data,
      ...attr
    };
  }

  public mergeWithData(data: Record<string, any> = {}) {
    this.data = {
      ...this.data,
      ...data,
    };
  }

  public getData(defaultValue: Record<string, any> = {}) {
    return {
      ...defaultValue,
      ...this.data
    };
  }

  public toKeycloakAttrs() {
    const attrs = reduce(this.data, (result, value, key) => {
      if (isUndefined(value) || isNull(value)) {
        return result;
      }
      if (this.schema && this.schema[key] && this.schema[key].serialize) {
        value = this.schema[key].serialize(value);
      }
      result[key] = [value];
      return result;
    }, {});

    return isEmpty(attrs) ? undefined : attrs;
  }

  private transformKeycloakAttr(keycloakAttr: Record<string, any[]>) {
    if (!keycloakAttr) {
      return {};
    }

    return mapValues(keycloakAttr, (val, key) => {
      const typeTransform =
        (this.schema && this.schema[key] && transforms[this.schema[key].type]);
      const customTransform = this.schema && this.schema[key] && this.schema[key].deserialize;
      const transform = customTransform || typeTransform || noop;
      return transform(val[0]);
    });
  }
}
