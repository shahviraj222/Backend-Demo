import fs from 'fs'
import path from 'path'

interface RequireArgs {
  dirName: string
  fileNamesToExclude?: Array<string>
  requireFunction?: (filePath: string) => void
}

export function requireFilesInDir({
  dirName,
  fileNamesToExclude = [],
  requireFunction,
}: RequireArgs) {
  fs.readdirSync(dirName).forEach(async (fileName: string) => {
    if (fileNamesToExclude.includes(fileName)) return

    const filePath = path.join(dirName, fileName)

    if (fs.statSync(filePath).isFile()) {
      if (requireFunction) {
        requireFunction(filePath)
      } else {
        require(filePath)
      }
    }
  })
}
