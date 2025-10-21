import { readFile, readdir } from "fs/promises";
import { join } from "path";
import {
  extractComponentPropsFromSource,
  extractDefaultValuesFromSource,
  type ComponentPropsInfo,
} from "./TsASTAbstractionForDoc";

// --- SOURCE MAP HANDLING ---
let componentSourceMap: Record<string, string> = {};
let sourceMapLoaded = false;

/**
 * Loads the pre-generated component source map file.
 * Skips loading in production to prevent Vercel build failures.
 */
async function loadSourceMap() {
  try {
    if (process.env.NODE_ENV === "production") {
      console.log("🚀 Skipping componentSourceCode.ts load in production");
      sourceMapLoaded = true;
      return;
    }

    const sourceMapModule = await import("./componentSourceCode");
    componentSourceMap = sourceMapModule.componentSourceMap || {};
    sourceMapLoaded = true;
    console.log(
      "✅ Loaded pre-generated source map with",
      Object.keys(componentSourceMap).length,
      "components from componentSourceCode.ts"
    );
  } catch (error) {
    console.error("❌ Failed to load componentSourceCode.ts:", error);
    sourceMapLoaded = true;
  }
}

// Initialize immediately
loadSourceMap();

// --- ENVIRONMENT ---
const isProduction = process.env.NODE_ENV === "production";

// --- COMPONENT FILE HELPERS ---
async function getComponentPathFromMapping(
  componentName: string
): Promise<string | null> {
  if (isProduction) return null;

  try {
    const mappingPath = join(process.cwd(), "data/ComponentMapping.ts");
    const mappingContent = await readFile(mappingPath, "utf-8");

    const componentRegex = new RegExp(
      `name:\\s*["']${componentName}["'][^}]*path:\\s*["']([^"']+)["']`,
      "g"
    );
    const match = componentRegex.exec(mappingContent);
    return match ? match[1] : null;
  } catch (error) {
    console.error("Error reading ComponentMapping for path:", error);
    return null;
  }
}

async function getComponentMappingImports(): Promise<Record<string, string>> {
  if (isProduction) return {};

  try {
    const mappingFilePath = join(process.cwd(), "data/ComponentMapping.ts");
    const mappingContent = await readFile(mappingFilePath, "utf-8");
    const imports: Record<string, string> = {};

    const defaultImportRegex = /import\s+(\w+)\s+from\s+["'](@\/[^"']+)["']/g;
    const destructuredImportRegex =
      /import\s+\{\s*([^}]+)\s*\}\s+from\s+["'](@\/[^"']+)["']/g;

    let match;
    while ((match = defaultImportRegex.exec(mappingContent)) !== null) {
      const [, componentName, importPath] = match;
      imports[componentName] = importPath.replace("@/", "") + ".tsx";
    }

    while ((match = destructuredImportRegex.exec(mappingContent)) !== null) {
      const [, componentNames, importPath] = match;
      const actualPath = importPath.replace("@/", "") + ".tsx";
      const names = componentNames.split(",").map((n) => n.trim());
      names.forEach((n) => (imports[n] = actualPath));
    }

    return imports;
  } catch (error) {
    console.error("Error reading ComponentMapping:", error);
    return {};
  }
}

async function findComponentFile(componentName: string): Promise<string | null> {
  if (isProduction) return null;

  const searchDirs = [
    "components",
    "components/vui",
    "components/ui",
    "components/vui/text",
    "components/vui/buttons",
    "components/vui/backgrounds",
    "components/vui/ai",
  ];
  const possibleNames = [
    `${componentName}.tsx`,
    `${componentName}.ts`,
    `${componentName}/index.tsx`,
    `${componentName}/index.ts`,
  ];

  for (const dir of searchDirs) {
    const fullDir = join(process.cwd(), dir);
    try {
      const files = await readdir(fullDir);
      for (const name of possibleNames) {
        if (files.includes(name.split("/")[0])) {
          const filePath = join(dir, name);
          try {
            await readFile(join(process.cwd(), filePath), "utf-8");
            return filePath;
          } catch {
            continue;
          }
        }
      }
    } catch {
      continue;
    }
  }
  return null;
}

async function getComponentClassName(displayName: string): Promise<string> {
  if (isProduction) return displayName.replace(/\s+/g, "");

  try {
    const mappingFilePath = join(process.cwd(), "data/ComponentMapping.ts");
    const mappingContent = await readFile(mappingFilePath, "utf-8");
    const regex = new RegExp(
      `name:\\s*["']${displayName}["'][^}]*component:\\s*(\\w+)`,
      "i"
    );
    const match = mappingContent.match(regex);
    return match ? match[1] : displayName.replace(/\s+/g, "");
  } catch {
    return displayName.replace(/\s+/g, "");
  }
}

// --- MAIN EXPORTS ---
export async function getComponentSourceCode(
  componentName: string
): Promise<string> {
  try {
    if (!sourceMapLoaded) await loadSourceMap();

    if (componentSourceMap[componentName]) {
      console.log(`✅ Found ${componentName} in componentSourceCode.ts`);
      return componentSourceMap[componentName];
    }

    if (!isProduction) {
      console.log(
        `⚠️ ${componentName} not found in componentSourceCode.ts, trying filesystem fallback...`
      );

      let filePath = await getComponentPathFromMapping(componentName);
      if (filePath) {
        const fullPath = join(process.cwd(), filePath);
        return await readFile(fullPath, "utf-8");
      }

      const className = await getComponentClassName(componentName);
      const imports = await getComponentMappingImports();
      filePath = imports[className] || (await findComponentFile(className));
      if (filePath) {
        const fullPath = join(process.cwd(), filePath);
        return await readFile(fullPath, "utf-8");
      }
    }

    const env = isProduction ? "production" : "development";
    console.error(`❌ Component "${componentName}" not found (${env})`);
    return `// ❌ Component source not found for "${componentName}"
import React from 'react';
export default function ${componentName.replace(/\s+/g, "")}() {
  return (
    <div className="p-8 text-center border-2 border-dashed border-orange-300 bg-orange-50 rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-orange-600">${componentName}</h2>
      <p className="text-orange-500">Component source not available</p>
    </div>
  );
}`;
  } catch (error) {
    console.error(`💥 Error loading source for ${componentName}:`, error);
    return `// 💥 Error loading source code for "${componentName}"
import React from 'react';
export default function ${componentName.replace(/\s+/g, "")}() {
  return <div>Error loading component source.</div>;
}`;
  }
}

export async function getComponentUsageExample(
  componentName: string,
  defaultProps?: Record<string, unknown>
): Promise<string> {
  const className = componentName.replace(/\s+/g, "");
  const propsString =
    defaultProps && Object.keys(defaultProps).length
      ? Object.entries(defaultProps)
          .map(([key, value]) =>
            typeof value === "string"
              ? `${key}="${value}"`
              : `${key}={${JSON.stringify(value)}}`
          )
          .join(" ")
      : "";

  return `import ${className} from '@/components/vui/${className}';
export default function Example() {
  return (
    <div className="p-8">
      <${className}${propsString ? ` ${propsString}` : ""} />
    </div>
  );
}`;
}

export async function getComponentPropsInfo(
  componentName: string
): Promise<ComponentPropsInfo | null> {
  try {
    const sourceCode = await getComponentSourceCode(componentName);
    if (!sourceCode.includes("function")) return null;

    const variations = [
      componentName,
      componentName.replace(/\s+/g, ""),
      componentName.replace(/\s+/g, "") + "Component",
      undefined,
    ];

    for (const variant of variations) {
      const props = extractComponentPropsFromSource(sourceCode, variant, {
        includePrivateProps: false,
        extractExamples: true,
        resolveUnions: true,
        maxDepth: 3,
      });
      if (props && props.props.length > 0) return props;
    }
    return null;
  } catch (error) {
    console.error(`💥 Error extracting props for ${componentName}:`, error);
    return null;
  }
}

export async function getDefaultProps(
  componentName: string
): Promise<Record<string, unknown>> {
  try {
    const sourceCode = await getComponentSourceCode(componentName);
    return extractDefaultValuesFromSource(sourceCode);
  } catch (error) {
    console.error(`💥 Error extracting defaults for ${componentName}:`, error);
    return {};
  }
}
