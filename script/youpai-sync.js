const upyun = require('upyun')
const fs = require('fs')
const path = require('path')

function usage() {
  console.log(
    'Usage: node youpai-sync.js [localDir] [remoteBase] [--delete] [--concurrency=N] [--dry-run]'
  )
}

function isDir(p) {
  try { return fs.statSync(p).isDirectory() } catch { return false }
}

function walkLocal(baseDir) {
  const entries = []
  const stack = ['']
  while (stack.length) {
    const rel = stack.pop()
    const abs = path.join(baseDir, rel)
    const listing = fs.readdirSync(abs)
    for (const name of listing) {
      const relPath = path.join(rel, name)
      const absPath = path.join(baseDir, relPath)
      const stat = fs.statSync(absPath)
      if (stat.isDirectory()) {
        entries.push({ type: 'dir', relPath })
        stack.push(relPath)
      } else if (stat.isFile()) {
        entries.push({ type: 'file', relPath })
      }
    }
  }
  return entries
}

function toRemote(remoteBase, relPath) {
  const joined = path.posix.join(remoteBase, relPath.split(path.sep).join('/'))
  return joined.startsWith('/') ? joined : '/' + joined
}

async function listAllRemote(client, remoteDir) {
  const out = []
  let iter = null
  while (true) {
    const res = await client.listDir(remoteDir, { limit: 1000, iter })
    if (res === false) break
    for (const f of res.files) {
      out.push({ name: f.name, type: f.type })
    }
    if (!res.next) break
    iter = res.next
  }
  return out
}

async function ensureDir(client, remoteDir) {
  try { await client.makeDir(remoteDir) } catch (_) { /* ignore */ }
}

async function uploadFile(client, localAbs, remotePath) {
  const stream = fs.createReadStream(localAbs)
  return client.putFile(remotePath, stream)
}

async function main() {
  const args = process.argv.slice(2)
  const localDir = args[0] || path.resolve(__dirname, 'out')
  const remoteBase = args[1] || '/'
  const deleteExtra = args.includes('--delete')
  const dryRun = args.includes('--dry-run')
  const cArg = args.find(a => a.startsWith('--concurrency='))
  const concurrency = cArg ? parseInt(cArg.split('=')[1], 10) : 4

  if (!isDir(localDir)) {
    usage()
    console.error('Local dir not found: ' + localDir)
    process.exit(1)
  }




  // 找到脚本中定义账号的地方，改为这样：
  const serviceName = process.env.YP_SPACE;
  const operatorName = process.env.YP_NAME;
  const operatorPassword = process.env.YP_PWD;

  if (!serviceName || !operatorName || !operatorPassword) {
    console.error('Missing env: YP_SPACE, YP_NAME, YP_PWD')
    process.exit(1)
  }

  const service = new upyun.Service(serviceName, operatorName, operatorPassword)
  const client = new upyun.Client(service)

  const entries = walkLocal(localDir)
  const dirs = entries.filter(e => e.type === 'dir')
  const files = entries.filter(e => e.type === 'file')

  console.log(`Found ${dirs.length} dirs, ${files.length} files under ${localDir}`)

  // Create directories first
  for (const d of dirs) {
    const remoteDir = toRemote(remoteBase, d.relPath)
    console.log(`[dir] ${remoteDir}`)
    if (!dryRun) await ensureDir(client, remoteDir)
  }

  // Upload files with limited concurrency
  let idx = 0
  async function worker() {
    while (idx < files.length) {
      const i = idx++
      const f = files[i]
      const localAbs = path.join(localDir, f.relPath)
      const remotePath = toRemote(remoteBase, f.relPath)
      process.stdout.write(`[file] ${remotePath}\n`)
      if (!dryRun) {
        try { await uploadFile(client, localAbs, remotePath) } catch (e) {
          console.error(`Upload failed: ${remotePath}`, e && e.message ? e.message : e)
        }
      }
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker))

  // Optionally delete remote files that are not present locally (flat only per directory)
  if (deleteExtra) {
    console.log('Deleting extra remote files not present locally...')
    // Walk each local directory; compare remote listing
    const localDirsSet = new Set(['/', ...dirs.map(d => '/' + d.relPath.split(path.sep).join('/'))].map(p => toRemote(remoteBase, p)))
    for (const remoteDir of localDirsSet) {
      const listing = await listAllRemote(client, remoteDir)
      const localNames = new Set(entries
        .filter(e => path.posix.dirname(toRemote(remoteBase, e.relPath)) === remoteDir)
        .map(e => path.posix.basename(toRemote(remoteBase, e.relPath))))
      for (const item of listing) {
        if (!localNames.has(item.name) && item.type === 'N') { // only delete files
          const target = path.posix.join(remoteDir, item.name)
          console.log(`[delete] ${target}`)
          if (!dryRun) {
            try { await client.deleteFile(target) } catch (e) {
              console.error(`Delete failed: ${target}`, e && e.message ? e.message : e)
            }
          }
        }
      }
    }
  }

  console.log('Sync finished.')
}

main()

// node youpai-sync.js ./out / --concurrency=8
// node youpai-sync.js ./out / --concurrency=8