// import React from 'react';
// import { View, Text, Dimensions } from 'react-native';
// import { AnimatedCircularProgress } from 'react-native-circular-progress';
// import { useTheme } from '../../context/ThemeContext';

// const { width } = Dimensions.get('window');

// const VerificationTarget: React.FC = () => {
//   const { colors } = useTheme();

//   const TARGET = {
//     total: 1000,
//     completed: 685,
//     pending: 315,
//   };

//   const percentage = (TARGET.completed / TARGET.total) * 100;

//   return (
//     <View
//       className="bg-white rounded-3xl p-6 mb-16"
//       style={{
//         elevation: 4,
//         shadowColor: '#000',
//         shadowOpacity: 0.05,
//         shadowRadius: 12,
//         shadowOffset: { width: 0, height: 6 },
//       }}
//     >
//       <Text
//         className="text-xl font-rubik-bold"
//         style={{ color: colors.text }}
//       >
//         Verification Target
//       </Text>

//       <Text className="text-sm text-gray-500 mt-1 mb-6 font-rubik">
//         Monthly verification progress
//       </Text>

//       <View className="items-center">
//         <AnimatedCircularProgress
//           size={width * 0.6}
//           width={18}
//           fill={percentage}
//           tintColor={colors.primary}
//           backgroundColor="#E5E7EB"
//           rotation={0}
//           arcSweepAngle={180}
//           lineCap="round"
//         >
//           {() => (
//             <View className="items-center">
//               <Text className="text-3xl font-rubik-bold">
//                 {percentage.toFixed(1)}%
//               </Text>

//               <View className="bg-green-100 px-3 py-1 rounded-full mt-2">
//                 <Text className="text-green-600 text-xs font-rubik-bold">
//                   +12.5%
//                 </Text>
//               </View>
//             </View>
//           )}
//         </AnimatedCircularProgress>
//       </View>

//       <View className="flex-row justify-between mt-8">
//         <Stat label="Target" value={TARGET.total} />
//         <Stat label="Completed" value={TARGET.completed} />
//         <Stat label="Pending" value={TARGET.pending} />
//       </View>
//     </View>
//   );
// };

// const Stat = ({ label, value }: any) => (
//   <View className="items-center">
//     <Text className="text-gray-400 text-xs font-rubik">
//       {label}
//     </Text>
//     <Text className="font-rubik-bold text-lg mt-1">
//       {value}
//     </Text>
//   </View>
// );

// export default VerificationTarget;