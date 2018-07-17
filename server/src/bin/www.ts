import {createApp} from '../app';
const port = process.env.NODE_PORT || 3000;

createApp().then(({app, server}) => {
  app.listen(port, () => {
    // tslint:disable-next-line:no-console
    console.log(`
      🚀 Server ready on port ${port}
      graphql at http://localhost:${port}${server.graphqlPath}
    `);
  });
})
.catch(err => {
  // tslint:disable-next-line:no-console
  console.log(err);
});
