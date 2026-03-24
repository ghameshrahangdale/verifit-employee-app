const fs = require('fs');
const path = require('path');

const screenName = process.argv[2];
const folderPath = process.argv[3] || 'screens';

if (!screenName) {
  console.log('❌ Please provide screen name');
  process.exit(1);
}

// Convert ScreenName → screen-name
const toKebabCase = (str) =>
  str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

const routeName = toKebabCase(screenName);

const filePath = path.join(__dirname, '..', folderPath, `${screenName}.tsx`);

// Create Screen Template
const template = `
import React from 'react';
import { View, Text } from 'react-native';

const ${screenName} = () => {
  return (
    <View>
      <Text>${screenName} Screen</Text>
    </View>
  );
};

export default ${screenName};
`;

// Create file
fs.mkdirSync(path.dirname(filePath), { recursive: true });
fs.writeFileSync(filePath, template);

console.log(`✅ Screen created: ${filePath}`);

// 👉 Append to Navigator (basic version)
const navigatorPath = path.join(
  __dirname,
  '..',
  'src',
  'navigation',
  'AppStackNavigator.tsx'
);

let navigatorContent = fs.readFileSync(navigatorPath, 'utf-8');

// Add import
navigatorContent = navigatorContent.replace(
  "import SubOrganizationsScreen from '../screens/SubOrganizationsScreen';",
  `import SubOrganizationsScreen from '../screens/SubOrganizationsScreen';
import ${screenName} from '../${folderPath}/${screenName}';`
);

// Add type
navigatorContent = navigatorContent.replace(
  '};',
  `  ${screenName}: undefined;\n};`
);

// Add Stack.Screen
navigatorContent = navigatorContent.replace(
  '</Stack.Navigator>',
  `  <Stack.Screen name="${screenName}" component={${screenName}} />\n</Stack.Navigator>`
);

fs.writeFileSync(navigatorPath, navigatorContent);

console.log('✅ Navigator updated!');