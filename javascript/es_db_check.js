function processFiles() {
    const esDataInput = document.getElementById('esData').value;
    if (!esDataInput.trim()) {
        alert('ES側データを入力してください。');
        return;
    }
    const dbFileInput = document.getElementById('dbFile');
    if (dbFileInput.files.length === 0) {
        alert('DB側のファイルを選択してください。');
        return;
    }

    const esDataArray = JSON.parse(esDataInput).hits.hits.map(hit => ({
        ...hit._source,
        entry_id: hit._source.entry_id.toString(),
        updated_at: hit._source.updated_at.toString()
    }));

    readDBData(dbFileInput.files[0])
        .then(dbDataArray => {
            const mergedData = mergeData(esDataArray, dbDataArray);
            const filteredData = filterData(mergedData);
            if (filteredData.length > 0) {
                displayMismatchedData(filteredData);
            } else {
                alert("データの不整合は見つかりませんでした。");
            }
        });
}

function readDBData(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const dbData = e.target.result;
            const dbDataArray = dbData.split('\n').slice(1).map(row => {
                const values = row.trim().split(',');
                return values.length > 1 ? { entry_id: values[0].toString(), updated_at: values[1].trim() } : null;
            }).filter(item => item !== null);
            resolve(dbDataArray);
        };
        reader.readAsText(file);
    });
}

function mergeData(esDataArray, dbDataArray) {
    return esDataArray.map(esItem => {
        const dbItem = dbDataArray.find(dbItem => dbItem.entry_id === esItem.entry_id);
        if (dbItem) {
            return { ...esItem, updated_at_from_db: dbItem.updated_at };
        }
        return { ...esItem, updated_at_from_db: undefined };
    });
}

function filterData(mergedData) {
    return mergedData.filter(item => item.updated_at !== item.updated_at_from_db);
}

function displayMismatchedData(dataArray) {
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsTable = document.getElementById('resultsTable').getElementsByTagName('tbody')[0];
    resultsTable.innerHTML = ''; // 既存の結果をクリア

    dataArray.forEach(item => {
        const row = resultsTable.insertRow();
        row.insertCell().textContent = item.entry_id;
        row.insertCell().textContent = item.updated_at;
        row.insertCell().textContent = item.updated_at_from_db;
        
        // 修正コマンドの生成とコピーボタンを含むセルの作成
        const repairCommand = `Entry.find(${item.entry_id}).__elasticsearch__.update_document`;
        const cell = row.insertCell();
        cell.textContent = repairCommand + " "; // 修正コマンドのテキスト
        
        // コピーボタンの作成
        const copyButton = document.createElement('button');
        copyButton.textContent = 'コピー';
        copyButton.style.marginLeft = '10px'; // ボタンとコマンドのテキストの間にマージンを追加
        copyButton.onclick = function() {
            navigator.clipboard.writeText(repairCommand).then(() => {
                alert('コピーしました！');
            }).catch(err => {
                console.error('コピーに失敗しました: ', err);
            });
        };
        cell.appendChild(copyButton); // ボタンをセルに追加
    });

    resultsContainer.style.display = 'block'; // 結果コンテナを表示
}


