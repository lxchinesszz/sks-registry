const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ─── 1. 获取环境变量 ─────────────────────────────────────────
const serviceName = process.env.YP_SPACE;
const operatorName = process.env.YP_NAME;
const operatorPassword = process.env.YP_PWD;

if (!serviceName || !operatorName || !operatorPassword) {
  console.error('❌ 错误: 缺少又拍云配置环境变量！请检查 GitHub Secrets。');
  process.exit(1);
}

// ─── 2. 计算又拍云 REST API 认证签名 ──────────────────────────
// 又拍云签名算法：MD5(操作员密码) 得到签名密钥
const passwordMd5 = crypto.createHash('md5').update(operatorPassword).digest('hex');

function getAuthHeader(method, uri, date) {
  // 签名字符串格式: Method&URI&Date
  const signString = `${method}&${uri}&${date}`;
  const signature = crypto
    .createHmac('sha1', passwordMd5)
    .update(signString)
    .digest('base64');
  return `UPYUN ${operatorName}:${signature}`;
}

// ─── 3. 定位静态产物目录 ─────────────────────────────────────────
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'out');

if (!fs.existsSync(OUT_DIR)) {
  console.error(`❌ 错误: 找不到构建产物目录 ${OUT_DIR}`);
  process.exit(1);
}

// ─── 4. 异步上传单文件函数 ───────────────────────────────────────
async function uploadFile(localPath, remotePath) {
  const fileBuffer = fs.readFileSync(localPath);
  const dateStr = new Date().toUTCString();
  
  // 又拍云 REST API 标准上传统一域名
  const url = `https://v0.api.upyun.com/${serviceName}${remotePath}`;
  const uri = `/${serviceName}${remotePath}`;
  
  const authHeader = getAuthHeader('PUT', uri, dateStr);

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': authHeader,
        'Date': dateStr,
        'Content-Length': fileBuffer.length
      },
      body: fileBuffer
    });

    if (response.ok) {
      console.log(`   ✅ 上传成功: ${remotePath}`);
    } else {
      const errorText = await response.text();
      console.error(`   ❌ 上传失败: ${remotePath} | 状态码: ${response.status} | 原因: ${errorText}`);
    }
  } catch (err) {
    console.error(`   ❌ 网络错误: ${remotePath} | 异常: ${err.message}`);
  }
}

// ─── 5. 遍历并执行上传 ──────────────────────────────────────────
async function uploadDirectory(localDir, remoteDir = '/') {
  const files = fs.readdirSync(localDir);

  for (const file of files) {
    const localPath = path.join(localDir, file);
    const remotePath = path.posix.join(remoteDir, file);
    const stat = fs.statSync(localPath);

    if (stat.isDirectory()) {
      await uploadDirectory(localPath, remotePath);
    } else {
      console.log(`🚀 准备上传: ${file} -> ${remotePath}`);
      await uploadFile(localPath, remotePath);
    }
  }
}

// 启动执行
(async () => {
  console.log('🛫 开始通过原生 API 同步 out 目录到又拍云空间...');
  await uploadDirectory(OUT_DIR);
  console.log('🏁 同步流程结束。');
})();
