class HillCipher {
    constructor() {
        this.matrixSize = 2;
        this.stepsOutput = [];
        this.currentKeyMethod = 'numeric'; // 'numeric' or 'text'
        this.initializeEventListeners();
        this.generateMatrixInputs();
    }

    initializeEventListeners() {
        // Manual matrix size input
        document.getElementById('matrixSizeInput').addEventListener('input', (e) => {
            const size = parseInt(e.target.value);
            if (size >= 2 && size <= 5) {
                this.matrixSize = size;
                this.generateMatrixInputs();
                this.validateKey();
            }
        });

        // Tab switching for key input methods
        document.getElementById('numericKeyTab').addEventListener('click', () => {
            this.switchKeyMethod('numeric');
        });

        document.getElementById('textKeyTab').addEventListener('click', () => {
            this.switchKeyMethod('text');
        });

        // Text key input
        document.getElementById('textKeyField').addEventListener('input', () => {
            this.validateTextKey();
        });

        document.getElementById('generateFromText').addEventListener('click', () => {
            this.generateMatrixFromText();
        });

        // Matrix inputs validation
        document.addEventListener('input', (e) => {
            if (e.target.id && e.target.id.startsWith('matrix_')) {
                this.validateKey();
            }
        });

        document.getElementById('generateRandomKey').addEventListener('click', () => {
            this.generateRandomKey();
        });

        document.getElementById('encryptBtn').addEventListener('click', () => {
            this.encrypt();
        });

        document.getElementById('decryptBtn').addEventListener('click', () => {
            this.decrypt();
        });

        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearAll();
        });
    }

    switchKeyMethod(method) {
        this.currentKeyMethod = method;

        // Update tab buttons
        document.getElementById('numericKeyTab').classList.toggle('active', method === 'numeric');
        document.getElementById('textKeyTab').classList.toggle('active', method === 'text');

        // Update panels
        document.getElementById('numericKeyInput').classList.toggle('active', method === 'numeric');
        document.getElementById('textKeyInput').classList.toggle('active', method === 'text');

        this.validateKey();
    }

    validateTextKey() {
        const textKey = document.getElementById('textKeyField').value.toUpperCase().replace(/[^A-Z]/g, '');
        const requiredLength = this.matrixSize * this.matrixSize;
        const generateBtn = document.getElementById('generateFromText');
        const validationDiv = document.getElementById('keyValidation');

        if (textKey.length < requiredLength) {
            generateBtn.disabled = true;
            generateBtn.textContent = `Потрібно ${requiredLength} літер (є ${textKey.length})`;

            if (textKey.length > 0) {
                validationDiv.innerHTML = '<div class="info-message">ℹ Введіть ще ' + (requiredLength - textKey.length) + ' літер</div>';
            } else {
                validationDiv.innerHTML = '';
            }
            return;
        }

        // Check if the key would create an invertible matrix
        const testMatrix = this.createMatrixFromText(textKey);
        const isInvertible = this.isInvertible(testMatrix);

        if (isInvertible) {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Створити матрицю з тексту';
            validationDiv.innerHTML = '<span class="valid-key">✓ Ключ створить оборотну матрицю</span>';
        } else {
            generateBtn.disabled = true;
            generateBtn.textContent = 'Ключ створить необоротну матрицю';

            // Show detailed validation with suggestions
            const suggestions = this.generateKeySuggestions(textKey);
            validationDiv.innerHTML = `
                <div class="invalid-key">
                    ✗ Цей ключ створить необоротну матрицю
                </div>
                <div class="key-suggestions">
                    <h4>Пропозиції для покращення ключа:</h4>
                    ${suggestions}
                </div>
            `;
        }
    }

    createMatrixFromText(textKey) {
        const matrix = [];
        let index = 0;

        for (let i = 0; i < this.matrixSize; i++) {
            matrix[i] = [];
            for (let j = 0; j < this.matrixSize; j++) {
                matrix[i][j] = this.letterToNumber(textKey[index]);
                index++;
            }
        }

        return matrix;
    }

    generateKeySuggestions(originalKey) {
        const requiredLength = this.matrixSize * this.matrixSize;
        const baseKey = originalKey.substring(0, requiredLength);
        let suggestions = '';

        // Try modifying one character at a time
        const workingSuggestions = [];

        for (let pos = 0; pos < requiredLength && workingSuggestions.length < 3; pos++) {
            for (let charCode = 65; charCode <= 90 && workingSuggestions.length < 3; charCode++) {
                const newChar = String.fromCharCode(charCode);
                if (newChar === baseKey[pos]) continue;

                const modifiedKey = baseKey.substring(0, pos) + newChar + baseKey.substring(pos + 1);
                const testMatrix = this.createMatrixFromText(modifiedKey);

                if (this.isInvertible(testMatrix)) {
                    workingSuggestions.push({
                        key: modifiedKey,
                        change: `Замінити "${baseKey[pos]}" на "${newChar}" в позиції ${pos + 1}`
                    });
                }
            }
        }

        if (workingSuggestions.length > 0) {
            suggestions += '<div class="suggestion-list">';
            workingSuggestions.forEach((suggestion, index) => {
                suggestions += `
                    <div class="suggestion-item">
                        <button class="suggestion-btn" onclick="hillCipher.applySuggestion('${suggestion.key}')">
                            ${suggestion.key}
                        </button>
                        <span class="suggestion-desc">${suggestion.change}</span>
                    </div>
                `;
            });
            suggestions += '</div>';
        } else {
            suggestions = '<div class="no-suggestions">Спробуйте використати інший ключ або згенеруйте випадковий числовий ключ</div>';
        }

        return suggestions;
    }

    applySuggestion(suggestedKey) {
        document.getElementById('textKeyField').value = suggestedKey;
        this.validateTextKey();
    }

    generateMatrixFromText() {
        const textKey = document.getElementById('textKeyField').value.toUpperCase().replace(/[^A-Z]/g, '');
        const requiredLength = this.matrixSize * this.matrixSize;

        if (textKey.length < requiredLength) {
            alert(`Потрібно мінімум ${requiredLength} літер для матриці ${this.matrixSize}x${this.matrixSize}`);
            return;
        }

        // Final check before creating matrix
        const matrix = this.createMatrixFromText(textKey);
        if (!this.isInvertible(matrix)) {
            alert('Цей ключ створить необоротну матрицю. Будь ласка, скористайтеся пропозиціями вище або виберіть інший ключ.');
            return;
        }

        // Convert text to matrix
        let index = 0;
        for (let i = 0; i < this.matrixSize; i++) {
            for (let j = 0; j < this.matrixSize; j++) {
                const letterValue = this.letterToNumber(textKey[index]);
                document.getElementById(`matrix_${i}_${j}`).value = letterValue;
                index++;
            }
        }

        // Switch to numeric view and validate
        this.switchKeyMethod('numeric');
        this.validateKey();

        // Show success message with matrix preview
        const validation = document.getElementById('keyValidation');
        validation.innerHTML = `
            <div class="success-message">
                ✓ Матрицю успішно створено з тексту "${textKey.substring(0, requiredLength)}"
                <div class="matrix-preview">
                    <h5>Створена матриця:</h5>
                    ${this.createMatrixHTML(matrix)}
                </div>
            </div>
        `;
    }

    generateMatrixInputs() {
        const keyMatrix = document.getElementById('keyMatrix');
        keyMatrix.innerHTML = '';
        keyMatrix.style.gridTemplateColumns = `repeat(${this.matrixSize}, 1fr)`;

        for (let i = 0; i < this.matrixSize; i++) {
            for (let j = 0; j < this.matrixSize; j++) {
                const input = document.createElement('input');
                input.type = 'number';
                input.min = '0';
                input.max = '25';
                input.value = i === j ? '1' : '0';
                input.id = `matrix_${i}_${j}`;
                input.className = 'matrix-input';
                keyMatrix.appendChild(input);
            }
        }
        this.validateKey();
    }

    validateKey() {
        if (this.currentKeyMethod === 'text') {
            this.validateTextKey();
            return;
        }

        const keyMatrix = this.getKeyMatrix();
        const validationDiv = document.getElementById('keyValidation');

        if (this.isInvertible(keyMatrix)) {
            validationDiv.innerHTML = '<span class="valid-key">✓ Ключ дійсний для шифрування</span>';
            document.getElementById('encryptBtn').disabled = false;
            document.getElementById('decryptBtn').disabled = false;
        } else {
            validationDiv.innerHTML = '<span class="invalid-key">✗ Ключ недійсний - матриця не оборотна</span>';
            document.getElementById('encryptBtn').disabled = true;
            document.getElementById('decryptBtn').disabled = true;
        }
    }

    generateRandomKey() {
        let matrix;
        let attempts = 0;
        const maxAttempts = 100;

        do {
            matrix = this.generateRandomMatrix();
            attempts++;
        } while (!this.isInvertible(matrix) && attempts < maxAttempts);

        if (attempts >= maxAttempts) {
            alert('Не вдалося згенерувати оборотну матрицю. Спробуйте ще раз.');
            return;
        }

        for (let i = 0; i < this.matrixSize; i++) {
            for (let j = 0; j < this.matrixSize; j++) {
                document.getElementById(`matrix_${i}_${j}`).value = matrix[i][j];
            }
        }
        this.validateKey();
    }

    generateRandomMatrix() {
        const matrix = [];
        for (let i = 0; i < this.matrixSize; i++) {
            matrix[i] = [];
            for (let j = 0; j < this.matrixSize; j++) {
                matrix[i][j] = Math.floor(Math.random() * 26);
            }
        }
        return matrix;
    }

    getKeyMatrix() {
        const matrix = [];
        for (let i = 0; i < this.matrixSize; i++) {
            matrix[i] = [];
            for (let j = 0; j < this.matrixSize; j++) {
                const value = parseInt(document.getElementById(`matrix_${i}_${j}`).value);
                matrix[i][j] = isNaN(value) ? 0 : value;
            }
        }
        return matrix;
    }

    letterToNumber(letter) {
        return letter.toUpperCase().charCodeAt(0) - 65;
    }

    numberToLetter(number) {
        return String.fromCharCode((number % 26) + 65);
    }

    preprocessText(text) {
        let cleaned = text.replace(/[^A-Za-z]/g, '').toUpperCase();
        while (cleaned.length % this.matrixSize !== 0) {
            cleaned += 'X';
        }
        return cleaned;
    }

    textToVectors(text) {
        const vectors = [];
        for (let i = 0; i < text.length; i += this.matrixSize) {
            const vector = [];
            for (let j = 0; j < this.matrixSize; j++) {
                vector.push(this.letterToNumber(text[i + j]));
            }
            vectors.push(vector);
        }
        return vectors;
    }

    vectorsToText(vectors) {
        let text = '';
        for (const vector of vectors) {
            for (const number of vector) {
                text += this.numberToLetter(number);
            }
        }
        return text;
    }

    multiplyMatrixVector(matrix, vector) {
        const result = [];
        for (let i = 0; i < matrix.length; i++) {
            let sum = 0;
            for (let j = 0; j < vector.length; j++) {
                sum += matrix[i][j] * vector[j];
            }
            result.push(sum % 26);
        }
        return result;
    }

    modInverse(a, m = 26) {
        a = ((a % m) + m) % m;
        for (let x = 1; x < m; x++) {
            if ((a * x) % m === 1) {
                return x;
            }
        }
        return null;
    }

    determinant(matrix) {
        const n = matrix.length;
        if (n === 2) {
            return (matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0]) % 26;
        } else if (n === 3) {
            return (
                matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) -
                matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
                matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0])
            ) % 26;
        }
        return 0;
    }

    isInvertible(matrix) {
        const det = this.determinant(matrix);
        const detMod = ((det % 26) + 26) % 26;
        return this.modInverse(detMod, 26) !== null;
    }

    matrixInverse(matrix) {
        const det = this.determinant(matrix);
        const detMod = ((det % 26) + 26) % 26;
        const detInv = this.modInverse(detMod, 26);

        if (detInv === null) {
            throw new Error('Матриця не оборотна');
        }

        const n = matrix.length;
        if (n === 2) {
            return [
                [((matrix[1][1] * detInv) % 26 + 26) % 26, ((-matrix[0][1] * detInv) % 26 + 26) % 26],
                [((-matrix[1][0] * detInv) % 26 + 26) % 26, ((matrix[0][0] * detInv) % 26 + 26) % 26]
            ];
        } else if (n === 3) {
            const adjugate = [
                [
                    (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) % 26,
                    (matrix[0][2] * matrix[2][1] - matrix[0][1] * matrix[2][2]) % 26,
                    (matrix[0][1] * matrix[1][2] - matrix[0][2] * matrix[1][1]) % 26
                ],
                [
                    (matrix[1][2] * matrix[2][0] - matrix[1][0] * matrix[2][2]) % 26,
                    (matrix[0][0] * matrix[2][2] - matrix[0][2] * matrix[2][0]) % 26,
                    (matrix[0][2] * matrix[1][0] - matrix[0][0] * matrix[1][2]) % 26
                ],
                [
                    (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0]) % 26,
                    (matrix[0][1] * matrix[2][0] - matrix[0][0] * matrix[2][1]) % 26,
                    (matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0]) % 26
                ]
            ];

            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    adjugate[i][j] = ((adjugate[i][j] * detInv) % 26 + 26) % 26;
                }
            }

            return adjugate;
        }

        throw new Error('Непідтримуваний розмір матриці');
    }

    encrypt() {
        this.stepsOutput = [];
        const inputText = document.getElementById('inputText').value;
        const keyMatrix = this.getKeyMatrix();

        if (!inputText.trim()) {
            alert('Будь ласка, введіть текст для шифрування');
            return;
        }

        try {
            const processedText = this.preprocessText(inputText);
            this.addVisualStep('Попередня обробка тексту',
                `Вихідний текст: "${inputText}"<br>Очищений текст: "${processedText}"<br>Доповнено до довжини ${processedText.length} (кратної ${this.matrixSize})`);

            this.addVisualStep('Ключова матриця',
                `<div class="matrix-display-container">
                    <h4>Матриця ключа:</h4>
                    ${this.createMatrixHTML(keyMatrix)}
                </div>`);

            const vectors = this.textToVectors(processedText);
            this.addVisualStep('Перетворення в числа', this.formatTextToNumbersVisual(processedText, vectors));

            const encryptedVectors = [];
            for (let i = 0; i < vectors.length; i++) {
                const vector = vectors[i];
                const rawResult = [];
                for (let j = 0; j < keyMatrix.length; j++) {
                    let sum = 0;
                    for (let k = 0; k < vector.length; k++) {
                        sum += keyMatrix[j][k] * vector[k];
                    }
                    rawResult.push(sum);
                }
                const encryptedVector = rawResult.map(x => x % 26);
                encryptedVectors.push(encryptedVector);

                this.addVisualStep(`Шифрування блоку ${i + 1}`,
                    this.formatMatrixMultiplicationVisual(keyMatrix, vector, rawResult, encryptedVector, 'encrypt'));
            }

            const encryptedText = this.vectorsToText(encryptedVectors);
            this.addVisualStep('Підсумковий результат', `<div class="result-text">Зашифрований текст: <strong>"${encryptedText}"</strong></div>`);

            document.getElementById('output').textContent = encryptedText;
            this.displayVisualSteps();
        } catch (error) {
            alert('Помилка шифрування: ' + error.message);
        }
    }

    decrypt() {
        this.stepsOutput = [];
        const inputText = document.getElementById('inputText').value;
        const keyMatrix = this.getKeyMatrix();

        if (!inputText.trim()) {
            alert('Будь ласка, введіть текст для розшифрування');
            return;
        }

        try {
            const processedText = this.preprocessText(inputText);
            this.addVisualStep('Попередня обробка тексту',
                `Вхідний текст: "${inputText}"<br>Очищений текст: "${processedText}"`);

            this.addVisualStep('Вихідна ключова матриця',
                `<div class="matrix-display-container">
                    <h4>Матриця ключа:</h4>
                    ${this.createMatrixHTML(keyMatrix)}
                </div>`);

            const inverseMatrix = this.matrixInverse(keyMatrix);
            this.addVisualStep('Обчислення оберненої матриці', this.formatMatrixInverseVisual(keyMatrix, inverseMatrix));

            const vectors = this.textToVectors(processedText);
            this.addVisualStep('Перетворення в числа', this.formatTextToNumbersVisual(processedText, vectors));

            const decryptedVectors = [];
            for (let i = 0; i < vectors.length; i++) {
                const vector = vectors[i];
                const rawResult = [];
                for (let j = 0; j < inverseMatrix.length; j++) {
                    let sum = 0;
                    for (let k = 0; k < vector.length; k++) {
                        sum += inverseMatrix[j][k] * vector[k];
                    }
                    rawResult.push(sum);
                }
                const decryptedVector = rawResult.map(x => ((x % 26) + 26) % 26);
                decryptedVectors.push(decryptedVector);

                this.addVisualStep(`Розшифрування блоку ${i + 1}`,
                    this.formatMatrixMultiplicationVisual(inverseMatrix, vector, rawResult, decryptedVector, 'decrypt'));
            }

            const decryptedText = this.vectorsToText(decryptedVectors);
            this.addVisualStep('Підсумковий результат', `<div class="result-text">Розшифрований текст: <strong>"${decryptedText}"</strong></div>`);

            document.getElementById('output').textContent = decryptedText;
            this.displayVisualSteps();
        } catch (error) {
            alert('Помилка розшифрування: ' + error.message);
        }
    }

    addVisualStep(title, content) {
        this.stepsOutput.push({ title, content });
    }

    formatMatrixMultiplicationVisual(matrix, vector, rawResult, finalResult, operation) {
        const matrixHtml = this.createMatrixHTML(matrix);
        const vectorHtml = this.createVectorHTML(vector);
        const rawResultHtml = this.createVectorHTML(rawResult);
        const finalResultHtml = this.createVectorHTML(finalResult);

        let html = `<div class="matrix-operation">
            <div class="operation-row">
                <div class="matrix-container">
                    ${matrixHtml}
                </div>
                <span class="operator">×</span>
                <div class="vector-container">
                    ${vectorHtml}
                </div>
                <span class="operator">=</span>
                <div class="vector-container">
                    ${rawResultHtml}
                </div>
            </div>
            <div class="mod-operation">
                <span class="mod-text">mod 26 =</span>
                <div class="vector-container">
                    ${finalResultHtml}
                </div>
            </div>
        </div>`;

        // Add detailed calculations
        html += '<div class="calculations">';
        html += '<h5>Детальні обчислення:</h5>';
        for (let i = 0; i < matrix.length; i++) {
            let calculation = '';
            for (let j = 0; j < vector.length; j++) {
                if (j > 0) calculation += ' + ';
                calculation += `${matrix[i][j]} × ${vector[j]}`;
            }
            calculation += ` = ${rawResult[i]} ≡ ${finalResult[i]} (mod 26)`;
            html += `<div class="calculation-step">${calculation}</div>`;
        }
        html += '</div>';

        return html;
    }

    formatTextToNumbersVisual(text, vectors) {
        let html = '<div class="text-conversion">';

        // Letter to number conversion
        html += '<div class="letter-numbers">';
        html += '<h4>Перетворення літер у числа:</h4>';
        for (let i = 0; i < text.length; i++) {
            const letter = text[i];
            const number = this.letterToNumber(letter);
            html += `<span class="letter-conversion">${letter} → ${number}</span>`;
        }
        html += '</div>';

        // Grouped vectors
        html += '<div class="vector-groups">';
        html += '<h4>Групування у вектори:</h4>';
        vectors.forEach((vector, index) => {
            html += `<div class="vector-group">
                <span class="block-label">Блок ${index + 1}:</span>
                <div class="vector-container">
                    ${this.createVectorHTML(vector)}
                </div>
            </div>`;
        });
        html += '</div>';

        return html;
    }

    formatMatrixInverseVisual(original, inverse) {
        const det = this.determinant(original);
        const detMod = ((det % 26) + 26) % 26;
        const detInv = this.modInverse(detMod, 26);

        let html = `<div class="matrix-inverse">
            <div class="original-matrix">
                <h4>Вихідна матриця:</h4>
                <div class="matrix-container">
                    ${this.createMatrixHTML(original)}
                </div>
            </div>
            <div class="determinant-calc">
                <h4>Обчислення детермінанта:</h4>
                <p>Детермінант = ${det} ≡ ${detMod} (mod 26)</p>
                <p>Обернений детермінант = ${detInv}</p>
            </div>
            <div class="inverse-matrix">
                <h4>Обернена матриця:</h4>
                <div class="matrix-container">
                    ${this.createMatrixHTML(inverse)}
                </div>
            </div>
        </div>`;

        return html;
    }

    createMatrixHTML(matrix) {
        let html = '<div class="matrix">';
        for (let i = 0; i < matrix.length; i++) {
            html += '<div class="matrix-row">';
            for (let j = 0; j < matrix[i].length; j++) {
                html += `<span class="matrix-cell">${matrix[i][j]}</span>`;
            }
            html += '</div>';
        }
        html += '</div>';
        return html;
    }

    createVectorHTML(vector) {
        let html = '<div class="vector">';
        for (let i = 0; i < vector.length; i++) {
            html += `<span class="vector-cell">${vector[i]}</span>`;
        }
        html += '</div>';
        return html;
    }

    displayVisualSteps() {
        const stepsContainer = document.getElementById('stepsOutput');
        stepsContainer.innerHTML = '';

        this.stepsOutput.forEach((step, index) => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'visual-step';

            const stepTitle = document.createElement('h3');
            stepTitle.textContent = `${index + 1}. ${step.title}`;
            stepTitle.className = 'step-title';

            const stepContent = document.createElement('div');
            stepContent.className = 'step-content';
            stepContent.innerHTML = step.content;

            stepDiv.appendChild(stepTitle);
            stepDiv.appendChild(stepContent);
            stepsContainer.appendChild(stepDiv);
        });
    }

    clearAll() {
        document.getElementById('inputText').value = '';
        document.getElementById('output').textContent = '';
        document.getElementById('stepsOutput').innerHTML = '';
        document.getElementById('textKeyField').value = '';
        document.getElementById('keyValidation').innerHTML = '';
        this.stepsOutput = [];

        // Reset matrix to identity
        for (let i = 0; i < this.matrixSize; i++) {
            for (let j = 0; j < this.matrixSize; j++) {
                document.getElementById(`matrix_${i}_${j}`).value = i === j ? '1' : '0';
            }
        }
        this.validateKey();
    }
}

// Global reference for suggestion buttons
let hillCipher;

document.addEventListener('DOMContentLoaded', () => {
    hillCipher = new HillCipher();
});
