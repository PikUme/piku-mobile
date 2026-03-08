import { Tabs } from 'expo-router';

import { AppBottomTabBar } from '@/components/shell/AppBottomTabBar';
import { TabIcon } from '@/components/ui/TabIcon';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={() => <AppBottomTabBar />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="home" />
          ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: '피드',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="newspaper" />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: '검색',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="search" />
          ),
        }}
      />
      <Tabs.Screen
        name="compose"
        options={{
          title: '오늘의 일기',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="create" />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: '친구',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="people" />
          ),
        }}
      />
    </Tabs>
  );
}
