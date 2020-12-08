import { mapValues, reduce, isUndefined, isNull, isEmpty, omit } from 'lodash';

const noop = v => v;

export enum FieldType {
  string = 'string',
  boolean = 'boolean',
  float = 'float',
  integer = 'integer'
}

const transforms = {
  [FieldType.string]: v => v.toString(),
  [FieldType.boolean]: v => v === 'true',
  [FieldType.float]: parseFloat,
  [FieldType.integer]: parseInt
};

export interface SchemaType {
  [key: string]: {
    type?: FieldType,
    serialize?: any,
    deserialize?: any
    rename?: string
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

      const fieldName = (this.schema[key] && this.schema[key].rename) || key;
      result[fieldName] = (fieldName === 'admins') ? value.split(',') : [value];
      return result;
    }, {});

    // having data but all filtered out
    if (!isEmpty(this.data) && isEmpty(attrs)) {
      return {};
    }

    // not having data and empty attrs, will return undefined to remain attrs intact
    // if attrs require to change, return attrs
    return isEmpty(attrs) ? undefined : attrs;
  }

  private transformKeycloakAttr(keycloakAttr: Record<string, any[]>) {
    if (!keycloakAttr) {
      return {};
    }

    const definedFields = [];
    const definedValues = reduce(this.schema, (result, value, key) => {
      const fieldName = value.rename || key;
      if (!keycloakAttr[fieldName]) {
        return result;
      }
      definedFields.push(fieldName);
      const typeTransform = transforms[value.type];
      const customTransform = value.deserialize;
      const transform = customTransform || typeTransform || noop;
      // admins transform
      result[key] = (fieldName === 'admins') ?
        keycloakAttr[fieldName].join(',') : transform(keycloakAttr[fieldName][0]);
      return result;
    }, {});

    // merge with fields not defined in schema
    const notDefinedValues = mapValues(omit(keycloakAttr, definedFields),
      attr => attr[0]);
    return {...definedValues, ...notDefinedValues};
  }
}
