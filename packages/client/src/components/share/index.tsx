import {Row, Col} from 'antd'
import styled from 'styled-components';

export const LightA = styled.a`
  color: #839ce0;
`;

export const FilterRow = styled(Row)`
  width: 100%;
  border: 1px #f8f8f8 solid;
  padding: 15px;
  box-shadow: 1px 1px 4px #eee;
`;

export const FilterPlugins = styled.div`
  flex: 1;
  margin-right: 15px;
  min-width: 100px;
`;

export const ButtonCol = styled(Col)`
  text-align: right;
  padding-top: 16px;
`;
