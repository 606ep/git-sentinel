Work has been just started

There should be a file sentinel.json with checking rules

```js
{
  "rules": [
    {
      "name": "lint ts",
      "mask": ".ts$",
      "separate": true,     // fire command separate for each file. Current file will be "${filename}" in cmd
      "stopOnError": false, // stop on first error in rule, default false
      "commands": [
        "node_modules/.bin/tslint ${filename}" // list of commands to run
      ]
    }
  ]
}
```