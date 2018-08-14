export default class Token {
  private token: string;
  private clientId: string;
  private header: any;
  private content: any;
  private signature: any;
  private signed: string;

  constructor(token, clientId) {
    this.token = token;
    this.clientId = clientId;
    if (token) {
      try {
        const parts = token.split('.');
        this.header = JSON.parse(new Buffer(parts[0], 'base64').toString());
        this.content = JSON.parse(new Buffer(parts[1], 'base64').toString());
        this.signature = new Buffer(parts[2], 'base64');
        this.signed = parts[0] + '.' + parts[1];
      } catch (err) {
        this.content = {
          exp: 0
        };
      }
    }
  }

  /**
   * Determine if this token is expired.
   *
   * @return {boolean} `true` if it is expired, otherwise `false`.
   */
  public isExpired(): boolean {
    return ((this.content.exp * 1000) < Date.now());
  }

  /**
   * Determine if this token has an associated role.
   *
   * This method is only functional if the token is constructed
   * with a `clientId` parameter.
   *
   * The parameter matches a role specification using the following rules:
   *
   * - If the name contains no colons, then the name is taken as the entire
   *   name of a role within the current application, as specified via
   *   `clientId`.
   * - If the name starts with the literal `realm:`, the subsequent portion
   *   is taken as the name of a _realm-level_ role.
   * - Otherwise, the name is split at the colon, with the first portion being
   *   taken as the name of an arbitrary application, and the subsequent portion
   *   as the name of a role with that app.
   *
   * @param {String} name The role name specifier.
   *
   * @return {boolean} `true` if this token has the specified role, otherwise `false`.
   */
  public hasRole(name: string): boolean {
    if (!this.clientId) {
      return false;
    }

    const parts = name.split(':');
    if (parts.length === 1) {
      return this.hasApplicationRole(this.clientId, parts[0]);
    }

    if (parts[0] === 'realm') {
      return this.hasRealmRole(parts[1]);
    }

    return this.hasApplicationRole(parts[0], parts[1]);
  }

  /**
   * Determine if this token has an associated specific application role.
   *
   * Even if `clientId` is not set, this method may be used to explicitly test
   * roles for any given application.
   *
   * @param {String} appName The identifier of the application to test.
   * @param {String} roleName The name of the role within that application to test.
   *
   * @return {boolean} `true` if this token has the specified role, otherwise `false`.
   */
  public hasApplicationRole(appName: string, roleName: string): boolean {
    const appRoles = this.content.resource_access[appName];

    if (!appRoles) {
      return false;
    }

    return (appRoles.roles.indexOf(roleName) >= 0);
  }

  /**
   * Determine if this token has an associated specific realm-level role.
   *
   * Even if `clientId` is not set, this method may be used to explicitly test
   * roles for the realm.
   *
   * @param {String} appName The identifier of the application to test.
   * @param {String} roleName The name of the role within that application to test.
   *
   * @return {boolean} `true` if this token has the specified role, otherwise `false`.
   */
  public hasRealmRole(roleName: string): boolean {
    // Make sure we have these properties before we check for a certain realm level role!
    // Without this we attempt to access an undefined property on token
    // for a user with no realm level roles.
    if (!this.content.realm_access || !this.content.realm_access.roles) {
      return false;
    }

    return (this.content.realm_access.roles.indexOf(roleName) >= 0);
  }
}
