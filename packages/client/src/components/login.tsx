import styled from 'styled-components';

export const LogoContainer = styled.div`
  text-align: center;
  margin-bottom: 30px;
`

export const LoginContainer = styled.div`
  align-self: center;
  max-width: 500px;
  margin: 0 auto;
  background-color: #FFF;
  border-radius: 5px;
  padding: 20px;
  box-shadow: 0 10px 16px 0 rgba(0,0,0,.2),0 6px 20px 0 rgba(0,0,0,.19) !important;
`

export const BodyWrapper = styled.div`
  background: linear-gradient(
    to left top,
    ${props => props.bottomRight || "#f2b173"},
    ${props => props.topLeft || "#e4506d"}
  );
  min-height: 600px;
  height: 100vh;
  width: 100%;
`

export const FooterContainer = styled.div`
  text-align: center;
  margin-top: 30px;
  color: ${props => props.color || "#FFF"};
  a {
    color: ${props => props.color || "#FFF"};
    text-decoration: underline;
  }
`
