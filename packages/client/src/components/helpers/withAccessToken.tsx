import React from "react";

export type AccessTokenComponentProps = {
  accessToken: string
};

export const withAccessToken = (Com) => {
  const accessToken = window.localStorage.getItem('canner.accessToken');
  return () => {
    return <Com accessToken={accessToken}/>
  }
};
