import * as  React from "react";
import { RouteComponentProps } from 'react-router';
import { Layout, Card, Breadcrumb, Icon, Button, Row, Col, Input } from 'antd';


// type Props = RouteComponentProps & {
// }

type Props = {
}

type State = {
    apiToken: any,
    graphqlEndpoint: string
}

export default class ApiTokenPage extends React.Component<Props, State> {

    constructor(props) {
        super(props)        

        const graphqlEndpoint = ((window as any).graphqlEndpoint ? 
            (window as any).graphqlEndpoint : 
            "http://localhost/api/graphql");
        
        this.state = {
            apiToken: "eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJkNTkxMjk4Yy1jNGU2LTRjMDEtOTBiYS02NTQxZTkxNDI1MWEifQ.eyJqdGkiOiJiMTc0ZjNlNy05MTdiLTQ1NTQtYWUzOS0xYzgyYjY4MWNhYzIiLCJleHAiOjAsIm5iZiI6MCwiaWF0IjoxNTkwMzg2NjM3LCJpc3MiOiJodHRwczovL2lkLmNlbHUuYXdzLnByaW1laHViLmlvL2F1dGgvcmVhbG1zL3ByaW1laHViIiwiYXVkIjoiaHR0cHM6Ly9pZC5jZWx1LmF3cy5wcmltZWh1Yi5pby9hdXRoL3JlYWxtcy9wcmltZWh1YiIsInN1YiI6IjU1Njc1YzM2LWMwYTgtNDUxOS05MTdlLWM3NzAwZjcwZDg0MiIsInR5cCI6Ik9mZmxpbmUiLCJhenAiOiJhZG1pbi11aSIsIm5vbmNlIjoid2Q5bnRyZnRhZ2giLCJhdXRoX3RpbWUiOjAsInNlc3Npb25fc3RhdGUiOiI3MWM1YzAyNi0wZmYzLTRjZWItYTg5OS05ODU1ZTlkYjJjNzgiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiXX0sInJlc291cmNlX2FjY2VzcyI6eyJyZWFsbS1tYW5hZ2VtZW50Ijp7InJvbGVzIjpbInZpZXctcmVhbG0iLCJ2aWV3LWlkZW50aXR5LXByb3ZpZGVycyIsIm1hbmFnZS1pZGVudGl0eS1wcm92aWRlcnMiLCJpbXBlcnNvbmF0aW9uIiwicmVhbG0tYWRtaW4iLCJjcmVhdGUtY2xpZW50IiwibWFuYWdlLXVzZXJzIiwicXVlcnktcmVhbG1zIiwidmlldy1hdXRob3JpemF0aW9uIiwicXVlcnktY2xpZW50cyIsInF1ZXJ5LXVzZXJzIiwibWFuYWdlLWV2ZW50cyIsIm1hbmFnZS1yZWFsbSIsInZpZXctZXZlbnRzIiwidmlldy11c2VycyIsInZpZXctY2xpZW50cyIsIm1hbmFnZS1hdXRob3JpemF0aW9uIiwibWFuYWdlLWNsaWVudHMiLCJxdWVyeS1ncm91cHMiXX19LCJzY29wZSI6ImVtYWlsIHByb2ZpbGUgb2ZmbGluZV9hY2Nlc3MifQ.LNa0GqS7N9awhP5SDxXvA2GZLHZddfirjhl0y64gi2Y",
            graphqlEndpoint
        }
    }

    render = () => {
        const token = this.state.apiToken;

        const example = `API_TOKEN="${token ? token : '<API TOKEN>'}"

curl -X POST \\
    -H 'Content-Type: application/json' \\
    -H 'authorization: Bearer \${API_TOKEN}' \\
    -d '{"query":"{me{id,username}}"}' \\
    ${this.state.graphqlEndpoint}`

        return (
        

            <Layout style={{ margin: "16px 64px" }}>
                <Card title="Token">
                    <Input disabled style={{ marginBottom: 16 }} addonAfter={(<div>Copy</div>)} defaultValue={token} />
                    <Row style={{ marginBottom: 16 }}>Please save this token. You won't be able to access it again.</Row>
                    <Button type="primary">Request API Token</Button>
                </Card>
                <Card title="Example" style={{ margin: "16px 0" }}>
                    <Input.TextArea
                        style={{
                            whiteSpace: 'nowrap',
                            background: 'black',
                            color: '#ddd',
                            fontFamily: 'monospace',
                        }}
                        rows={8}
                        value={example}
                    />
                </Card>
            </Layout>
        )
    }
}