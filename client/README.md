## Dev

```
npm run start
```

## Prod

```
npm run build
```

All static files (js, css, img...) will be in folder `client/dist`.

## Override Antd Style

1. Run `npm run start` to develop.
2. Edit the `theme` in `package.json`.
3. Run `npm run antd` to rebuild a new `antd.css` in `dist`, and refresh the web you can see your new style.


See [all antd variables](https://github.com/ant-design/ant-design/blob/master/components/style/themes/default.less)
