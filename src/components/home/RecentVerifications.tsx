import React from 'react';
import { View, Text, Image } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Avatar from '../ui/Avatar';

const RecentVerifications: React.FC = () => {
  const { colors } = useTheme();

  const DATA = [
    {
      id: 1,
      name: 'Amit Sharma',
      joiningDate: '12 Feb 2024',
      designation: 'Software Engineer',
      department: 'IT',
      status: 'Verified',
      profile: 'https://i.pravatar.cc/150?img=1',
    },
    {
      id: 2,
      name: 'Priya Verma',
      joiningDate: '08 Jan 2024',
      designation: 'HR Manager',
      department: 'HR',
      status: 'Pending',
      profile: 'https://i.pravatar.cc/150?img=2',
    },
    {
      id: 3,
      name: 'Rahul Deshmukh',
      joiningDate: '18 Mar 2024',
      designation: 'Product Manager',
      department: 'Product',
      status: 'Verified',
      profile: 'https://i.pravatar.cc/150?img=3',
    },
  ];

  return (
    <View className="mb-10">
      <Text
        className="text-xl font-rubik-bold mb-5"
        style={{ color: colors.text }}
      >
        Recent Verifications
      </Text>

      {DATA.map(item => {
        const isVerified = item.status === 'Verified';

        return (
          <View
            key={item.id}
            className="bg-white rounded-2xl p-5 mb-4"
            style={{
              shadowColor: '#000',
              shadowOpacity: 0.04,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
              borderColor: colors.primary + '30',
              borderWidth: 1,
            }}
          >
            {/* Top Row */}
            <View className="flex-row items-center">
              <Avatar imageUrl={item.profile} size="lg" />

              <View className="ml-4 flex-1">
                <Text className="text-base font-rubik-bold text-gray-900">
                  {item.name}
                </Text>

                <Text className="text-sm text-gray-500 mt-1 font-rubik">
                  {item.designation} • {item.department}
                </Text>
              </View>

              {/* Status Badge */}
              <View
                className="px-3 py-1 rounded-lg flex-row items-center"
                style={{ 
                  backgroundColor: isVerified ? '#22C55E20' : '#F9731620' 
                }}
              >
                {isVerified ? (
                  <>
                    {/* <Image 
                      source={require('../../assets/icons/verified.png')} 
                      className="w-3.5 h-3.5"
                      style={{ tintColor: '#22C55E' }}
                    /> */}
                    <Text className="text-xs ml-1 font-rubik text-green-600">
                      Verified
                    </Text>
                  </>
                ) : (
                  <>
                    {/* <Image 
                      source={require('../../assets/icons/clock.png')} 
                      className="w-3.5 h-3.5"
                      style={{ tintColor: '#F97316' }}
                    /> */}
                    <Text className="text-xs ml-1 font-rubik text-orange-600">
                      Pending
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* Details */}
            <View className="mt-4">
              <Text className="text-xs text-gray-400 font-rubik">
                Joined: {item.joiningDate}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default RecentVerifications;