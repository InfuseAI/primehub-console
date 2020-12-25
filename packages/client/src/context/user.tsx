import React from "react";

export interface UserContextValue {
  id: string;
  username: string;
  isCurrentGroupAdmin: boolean;
}

export const UserContext = React.createContext<UserContextValue>(undefined);

export type UserContextComponentProps = {
  userContext: UserContextValue
}

export  function withUserContext(Com) {
  return class ComWithUserContext extends React.Component<any> {
    render() {
      return <UserContext.Consumer>
        {(userContext) => {
          return <Com {...this.props} userContext={userContext} />
        }}
      </UserContext.Consumer>
    }
  }
}
