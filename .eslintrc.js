// eslint-disable-next-line no-undef
module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": "eslint:recommended",
    "overrides": [
    ],
    "parserOptions": {
        "ecmaVersion": "latest"
    },
    "rules": {
        "no-unused-vars": ["warn"]
    },
    "globals": {
        "Matrix": true,
        "Vector": true,
        "Vector3": true,
        "Vector4": true,
        "Renderer": true,
        "mat4x4Perspective": true,
        "mat4x4MPer": true,
        "mat4x4Viewport": true,
        "mat4x4Identity": true,
        "mat4x4Translate": true,
        "mat4x4Scale": true,
        "mat4x4RotateX": true,
        "mat4x4RotateY": true,
        "mat4x4RotateZ": true,
        "mat4x4ShearXY": true,

    }
}
