import React, { useState, useEffect } from 'react';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';

function Detail(props: any) {
  return (
    <React.Fragment>
      User detail
    </React.Fragment>
  );
}

export const UserDetail = compose()(Detail);
