# navitime-functions
navitime challenge用のfunction


## ディレクトリ構成
```
$ tree -L 2 -d
.
├── seeds               # シードデータ置き場
└── src
    ├── commands        # npm-script用。firestoreへのシードデータを登録する
    └── index.js        # cloud functions用のコード
```

## Usage
- Cloud Functionsのデプロイ
```
$ npm run deploy
```

- firestoreへのシードデータアップロード
```
$ npm run dbseed:〇〇
```
