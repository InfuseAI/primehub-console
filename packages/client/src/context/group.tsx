import React from "react";

export interface GroupContextValue {
  id: string;
  name: string;
  displayName: string;
  admins: string;
}

export const GroupContext = React.createContext<GroupContextValue>(undefined);

export type GroupContextComponentProps = {
  groupContext: GroupContextValue
}

export  function withGroupContext(Com) {
  return class ComWithGroupContext extends React.Component<any> {
    render() {
      return <GroupContext.Consumer>
        {(groupContext) => {
          return <Com {...this.props} groupContext={groupContext} />
        }}
      </GroupContext.Consumer>
    }
  }
}
