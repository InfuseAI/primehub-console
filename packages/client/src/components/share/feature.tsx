import React from 'react';

interface Props {
  children?: React.ReactNode;
  ce?: boolean;
  ee?: boolean;
  modelDeploy?: boolean;
}

function Feature(props: Props) {
  const { ce = true, ee = true, modelDeploy = true, children } = props;
  if (!ce && __ENV__ === 'ce') return <></>;
  if (!ee && __ENV__ === 'ee') return <></>;
  if (!modelDeploy && __ENV__ === 'modelDeploy') return null;
  return <React.Fragment>{children}</React.Fragment>;
}

export const FeatureCE = (props: { children?: React.ReactNode }) => {
  return (
    <Feature ee={false} modelDeploy={false}>
      {props.children}
    </Feature>
  );
};

export const FeatureEE = (props: { children?: React.ReactNode }) => {
  return (
    <Feature modelDeploy={false} ce={false}>
      {props.children}
    </Feature>
  );
};

export const FeatureModelDeploy = (props: { children?: React.ReactNode }) => {
  return (
    <Feature ee={false} ce={false}>
      {props.children}
    </Feature>
  );
};

export default Feature;
