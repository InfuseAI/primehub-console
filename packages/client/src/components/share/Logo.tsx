import styled from 'styled-components';
import logo from 'images/primehub-logo-w.svg';

const headerHeight = 64;
export const Logo = styled.div`
  background-image: url(${logo});
  background-color: #373d62;
  background-size: 65%;
  background-position: 14px 13px;
  background-repeat: no-repeat;
  width: 200px;
  height: ${headerHeight}px;
`;
