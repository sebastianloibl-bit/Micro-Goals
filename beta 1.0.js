import { Redirect } from "expo-router";

export function Index() {
  return <Redirect href="/(tabs)" />;
}

import { useAuth } from "@/utils/auth/useAuth";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// export default function RootLayout() - Duplicate, commented out
function RootLayout() {
  const { initiate, isReady } = useAuth();

  useEffect(() => {
    initiate();
  }, [initiate]);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="add-goal"
            options={{
              presentation: "modal",
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen name="goal/[id]" />
        </Stack>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
import { Tabs } from "expo-router";
import {
  CheckCircle2,
  Target,
  Flame,
  Settings,
  BarChart3,
} from "lucide-react-native";

// export default function TabLayout() - Duplicate, renamed
function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderColor: "#E5E7EB",
          paddingTop: 4,
        },
        tabBarActiveTintColor: "#3B82F6",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ color }) => <CheckCircle2 color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: "Goals",
          tabBarIcon: ({ color }) => <Target color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color }) => <BarChart3 color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="streaks"
        options={{
          title: "Streaks",
          tabBarIcon: ({ color }) => <Flame color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  CheckCircle2,
} from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";

// export default function AnalyticsScreen() - Duplicate, renamed
function AnalyticsScreen() {
  const insets = useSafeAreaInsets();

  // Fetch goals with task counts
  const {
    data: goals = [],
    isLoading: goalsLoading,
    refetch: refetchGoals,
  } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const response = await fetch("/api/goals");
      if (!response.ok) throw new Error("Failed to fetch goals");
      return response.json();
    },
  });

  // Fetch all tasks
  const {
    data: tasks = [],
    isLoading: tasksLoading,
    refetch: refetchTasks,
  } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const response = await fetch("/api/tasks");
      if (!response.ok) throw new Error("Failed to fetch tasks");
      return response.json();
    },
  });

  const isLoading = goalsLoading || tasksLoading;

  const refetch = () => {
    refetchGoals();
    refetchTasks();
  };

  // Calculate analytics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed_at).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate total time invested (completed tasks only)
  const totalMinutes = tasks
    .filter((t) => t?.completed_at)
    .reduce((sum, t) => sum + (parseInt(t?.duration_minutes, 10) || 5), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  // Find most productive goal
  const goalStats = goals.map((goal) => ({
    ...goal,
    completed: parseInt(goal.completed_tasks || '0', 10),
  }));
  const mostProductiveGoal = goalStats.reduce(
    (max, goal) => (goal.completed > max.completed ? goal : max),
    { completed: 0, title: "None yet" },
  );

  // Calculate tasks completed this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const tasksThisWeek = tasks.filter((t) => {
    if (!t?.completed_at) return false;
    try {
      const completedDate = new Date(t.completed_at);
      return completedDate >= oneWeekAgo;
    } catch {
      return false;
    }
  }).length;

  return (
    <View
      style={{ flex: 1, backgroundColor: "#F9FAFB", paddingTop: insets.top }}
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 16,
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderBottomColor: "#E5E7EB",
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "700",
            color: "#111827",
            marginBottom: 4,
          }}
        >
          Analytics
        </Text>
        <Text style={{ fontSize: 15, color: "#6B7280" }}>
          Track your progress and insights
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {isLoading ? (
          <View style={{ paddingTop: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : (
          <View style={{ paddingTop: 20, paddingHorizontal: 20 }}>
            {/* Completion Rate Card */}
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 20,
                padding: 24,
                marginBottom: 16,
                borderWidth: 2,
                borderColor: completionRate >= 50 ? "#10B981" : "#E5E7EB",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: completionRate >= 50 ? "#D1FAE5" : "#F3F4F6",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <TrendingUp
                  color={completionRate >= 50 ? "#10B981" : "#9CA3AF"}
                  size={40}
                />
              </View>
              <Text
                style={{
                  fontSize: 48,
                  fontWeight: "700",
                  color: "#111827",
                  marginBottom: 4,
                }}
              >
                {completionRate}%
              </Text>
              <Text style={{ fontSize: 16, color: "#6B7280", marginBottom: 8 }}>
                Completion Rate
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#6B7280",
                }}
              >
                {completedTasks} of {totalTasks} tasks completed
              </Text>
            </View>

            {/* Stats Grid */}
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
              {/* Pending Tasks */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  alignItems: "center",
                }}
              >
                <BarChart3
                  color="#F59E0B"
                  size={32}
                  style={{ marginBottom: 12 }}
                />
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: "700",
                    color: "#111827",
                    marginBottom: 4,
                  }}
                >
                  {pendingTasks}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: "#6B7280",
                    textAlign: "center",
                  }}
                >
                  Pending Tasks
                </Text>
              </View>

              {/* This Week */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  alignItems: "center",
                }}
              >
                <Calendar
                  color="#3B82F6"
                  size={32}
                  style={{ marginBottom: 12 }}
                />
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: "700",
                    color: "#111827",
                    marginBottom: 4,
                  }}
                >
                  {tasksThisWeek}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: "#6B7280",
                    textAlign: "center",
                  }}
                >
                  This Week
                </Text>
              </View>
            </View>

            {/* Time Invested Card */}
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: 20,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <CheckCircle2
                  color="#8B5CF6"
                  size={24}
                  style={{ marginRight: 12 }}
                />
                <Text
                  style={{ fontSize: 18, fontWeight: "600", color: "#111827" }}
                >
                  Time Invested
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: "700",
                  color: "#111827",
                  marginBottom: 4,
                }}
              >
                {totalHours > 0 && `${totalHours}h `}
                {remainingMinutes}m
              </Text>
              <Text style={{ fontSize: 14, color: "#6B7280" }}>
                Total time spent on completed tasks
              </Text>
            </View>

            {/* Most Productive Goal */}
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: 20,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: "#111827",
                  marginBottom: 12,
                }}
              >
                🏆 Most Productive Goal
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#3B82F6",
                  marginBottom: 4,
                }}
              >
                {mostProductiveGoal.title}
              </Text>
              <Text style={{ fontSize: 14, color: "#6B7280" }}>
                {mostProductiveGoal.completed} tasks completed
              </Text>
            </View>

            {/* Insights Card */}
            <View
              style={{
                backgroundColor: "#FEF3C7",
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: "#FDE68A",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#92400E",
                  marginBottom: 8,
                }}
              >
                💡 Insights
              </Text>
              <Text style={{ fontSize: 14, color: "#92400E", lineHeight: 20 }}>
                {completionRate >= 70
                  ? "Amazing work! You're crushing your goals! 🎉"
                  : completionRate >= 50
                    ? "Great progress! Keep up the momentum! 💪"
                    : completionRate >= 25
                      ? "You're making progress! Stay consistent! 🌟"
                      : "Start small - complete one task today! 🚀"}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Target, Plus, CheckCircle2 } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";

// export default function GoalsScreen() - Duplicate, renamed
function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Fetch all goals
  const {
    data: goals = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const response = await fetch("/api/goals");
      if (!response.ok) throw new Error("Failed to fetch goals");
      return response.json();
    },
  });

  return (
    <View
      style={{ flex: 1, backgroundColor: "#F9FAFB", paddingTop: insets.top }}
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 16,
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderBottomColor: "#E5E7EB",
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "700",
            color: "#111827",
            marginBottom: 4,
          }}
        >
          My Goals
        </Text>
        <Text style={{ fontSize: 15, color: "#6B7280" }}>
          {goals.length} {goals.length === 1 ? "goal" : "goals"} in progress
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {isLoading ? (
          <View style={{ paddingTop: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : goals.length === 0 ? (
          <View
            style={{
              paddingTop: 60,
              paddingHorizontal: 20,
              alignItems: "center",
            }}
          >
            <Target color="#D1D5DB" size={64} />
            <Text
              style={{
                marginTop: 16,
                fontSize: 18,
                fontWeight: "600",
                color: "#6B7280",
              }}
            >
              No goals yet
            </Text>
            <Text
              style={{
                marginTop: 8,
                fontSize: 15,
                color: "#9CA3AF",
                textAlign: "center",
              }}
            >
              Start by adding your first big goal
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/add-goal")}
              style={{
                marginTop: 24,
                backgroundColor: "#3B82F6",
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                Add Goal
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ paddingTop: 16, paddingHorizontal: 20 }}>
            {goals.map((goal) => {
              const totalTasks =
                parseInt(goal.pending_tasks, 10) + parseInt(goal.completed_tasks, 10);
              const progress =
                totalTasks > 0
                  ? (parseInt(goal.completed_tasks, 10) / totalTasks) * 100
                  : 0;

              return (
                <TouchableOpacity
                  key={goal.id}
                  onPress={() => router.push(`/goal/${goal.id}`)}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      marginBottom: 12,
                    }}
                  >
                    <Target
                      color="#3B82F6"
                      size={24}
                      style={{ marginRight: 12, marginTop: 2 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "600",
                          color: "#111827",
                          marginBottom: 4,
                        }}
                      >
                        {goal.title}
                      </Text>
                      {goal.description && (
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#6B7280",
                            lineHeight: 20,
                          }}
                        >
                          {goal.description}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Progress Bar */}
                  {totalTasks > 0 && (
                    <View>
                      <View
                        style={{
                          height: 6,
                          backgroundColor: "#E5E7EB",
                          borderRadius: 3,
                          overflow: "hidden",
                          marginBottom: 8,
                        }}
                      >
                        <View
                          style={{
                            height: "100%",
                            width: `${progress}%`,
                            backgroundColor: "#3B82F6",
                            borderRadius: 3,
                          }}
                        />
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text style={{ fontSize: 13, color: "#6B7280" }}>
                          {goal.completed_tasks} of {totalTasks} tasks done
                        </Text>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: "#3B82F6",
                          }}
                        >
                          {Math.round(progress)}%
                        </Text>
                      </View>
                    </View>
                  )}

                  {totalTasks === 0 && (
                    <Text
                      style={{
                        fontSize: 13,
                        color: "#9CA3AF",
                        fontStyle: "italic",
                      }}
                    >
                      No tasks yet - tap to add some
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={() => router.push("/add-goal")}
        style={{
          position: "absolute",
          bottom: insets.bottom + 20,
          right: 20,
          backgroundColor: "#3B82F6",
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Plus color="#fff" size={28} />
      </TouchableOpacity>
    </View>
  );
}
import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { CheckCircle2, Circle, Plus, Clock, Flame } from "lucide-react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

// export default function TodayScreen() - Duplicate, renamed
function TodayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [completingId, setCompletingId] = useState(null);

  // Fetch today's tasks
  const {
    data: tasks = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const response = await fetch("/api/tasks");
      if (!response.ok) throw new Error("Failed to fetch tasks");
      return response.json();
    },
  });

  // Complete task mutation
  const completeMutation = useMutation({
    mutationFn: async (taskId) => {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to complete task");
      return response.json();
    },
    onMutate: (taskId) => {
      setCompletingId(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tasks"]);
      queryClient.invalidateQueries(["goals"]);
      queryClient.invalidateQueries(["streak"]);
      setCompletingId(null);
    },
    onError: () => {
      setCompletingId(null);
    },
  });

  const handleCompleteTask = useCallback(
    (taskId) => {
      completeMutation.mutate(taskId);
    },
    [completeMutation],
  );

  const pendingTasks = tasks.filter((t) => !t.completed_at);
  const completedTasks = tasks.filter((t) => t.completed_at);
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  return (
    <View
      style={{ flex: 1, backgroundColor: "#F9FAFB", paddingTop: insets.top }}
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 16,
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderBottomColor: "#E5E7EB",
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "700",
            color: "#111827",
            marginBottom: 4,
          }}
        >
          Today
        </Text>
        <Text style={{ fontSize: 15, color: "#6B7280" }}>
          {completedTasks.length} of {tasks.length} tasks completed
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {isLoading ? (
          <View style={{ paddingTop: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : pendingTasks.length === 0 && completedTasks.length === 0 ? (
          <View
            style={{
              paddingTop: 60,
              paddingHorizontal: 20,
              alignItems: "center",
            }}
          >
            <CheckCircle2 color="#D1D5DB" size={64} />
            <Text
              style={{
                marginTop: 16,
                fontSize: 18,
                fontWeight: "600",
                color: "#6B7280",
              }}
            >
              No tasks for today
            </Text>
            <Text
              style={{
                marginTop: 8,
                fontSize: 15,
                color: "#9CA3AF",
                textAlign: "center",
              }}
            >
              Add tasks to your goals to get started
            </Text>
          </View>
        ) : (
          <View style={{ paddingTop: 16, paddingHorizontal: 20 }}>
            {/* Pending Tasks */}
            {pendingTasks.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: 12,
                  }}
                >
                  To Do ({pendingTasks.length})
                </Text>
                {pendingTasks.map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    onPress={() => handleCompleteTask(task.id)}
                    disabled={completingId === task.id}
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: 12,
                      padding: 14,
                      marginBottom: 10,
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    {completingId === task.id ? (
                      <ActivityIndicator
                        size="small"
                        color="#3B82F6"
                        style={{ marginRight: 12 }}
                      />
                    ) : (
                      <Circle
                        color="#3B82F6"
                        size={22}
                        style={{ marginRight: 12 }}
                      />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "500",
                          color: "#111827",
                          marginBottom: 4,
                        }}
                      >
                        {task.title}
                      </Text>
                      {task.goal_title && (
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#6B7280",
                          }}
                        >
                          {task.goal_title}
                        </Text>
                      )}
                    </View>
                    {task.duration_minutes && (
                      <View
                        style={{
                          backgroundColor: "#F3F4F6",
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 6,
                          marginLeft: 8,
                        }}
                      >
                        <Text style={{ fontSize: 12, color: "#6B7280" }}>
                          {task.duration_minutes}m
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: 12,
                  }}
                >
                  Done ({completedTasks.length})
                </Text>
                {completedTasks.map((task) => (
                  <View
                    key={task.id}
                    style={{
                      backgroundColor: "#F9FAFB",
                      borderRadius: 12,
                      padding: 14,
                      marginBottom: 10,
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <CheckCircle2
                      color="#10B981"
                      size={22}
                      style={{ marginRight: 12 }}
                    />
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 15,
                        color: "#6B7280",
                        textDecorationLine: "line-through",
                      }}
                    >
                      {task.title}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  Shield,
  FileText,
  Trash2,
  ExternalLink,
  Info,
} from "lucide-react-native";

// export default function SettingsScreen() - Duplicate, renamed
function SettingsScreen() {
  const insets = useSafeAreaInsets();

  const handlePrivacyPolicy = () => {
    Alert.alert(
      "Privacy Policy",
      "Data Collection & Usage\n\n" +
        "Our app collects and stores the following data locally on your device:\n\n" +
        "• Goal titles and descriptions\n" +
        "• Task information and completion status\n" +
        "• Streak data and activity history\n" +
        "• Task completion dates and times\n\n" +
        "How We Use Your Data:\n" +
        "• All data is stored locally on your device\n" +
        "• We do not share your data with third parties\n" +
        "• Data is used solely to provide app functionality\n" +
        "• No personal information is collected\n\n" +
        "Data Deletion:\n" +
        "You can request deletion of all your data at any time through the app settings. This action is permanent and cannot be undone.\n\n" +
        "Contact:\n" +
        "For questions about your data or privacy, please contact us through the app support.",
      [{ text: "OK" }],
    );
  };

  const handleDataDeletion = () => {
    Alert.alert(
      "Delete All Data",
      "This will permanently delete all your goals, tasks, and streak data. This action cannot be undone.\n\nAre you sure you want to continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All Data",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete all goals (which cascades to tasks)
              const goalsResponse = await fetch("/api/goals");
              if (goalsResponse.ok) {
                const goals = await goalsResponse.json();
                await Promise.all(
                  goals.map((goal) =>
                    fetch(`/api/goals/${goal.id}`, { method: "DELETE" }),
                  ),
                );
              }

              Alert.alert(
                "Success",
                "All your data has been permanently deleted.",
              );
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "Failed to delete data. Please try again.");
            }
          },
        },
      ],
    );
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: "#F9FAFB", paddingTop: insets.top }}
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 16,
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderBottomColor: "#E5E7EB",
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "700",
            color: "#111827",
            marginBottom: 4,
          }}
        >
          Settings
        </Text>
        <Text style={{ fontSize: 15, color: "#6B7280" }}>
          Privacy and data management
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: 20, paddingHorizontal: 20 }}>
          {/* Privacy Section */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: "#6B7280",
                marginBottom: 12,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Privacy & Data
            </Text>

            {/* Privacy Policy */}
            <TouchableOpacity
              onPress={handlePrivacyPolicy}
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 16,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#EFF6FF",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Shield color="#3B82F6" size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#111827",
                    marginBottom: 2,
                  }}
                >
                  Privacy Policy
                </Text>
                <Text style={{ fontSize: 13, color: "#6B7280" }}>
                  View how we handle your data
                </Text>
              </View>
              <ExternalLink color="#9CA3AF" size={20} />
            </TouchableOpacity>

            {/* Data Collection Info */}
            <View
              style={{
                backgroundColor: "#F0FDF4",
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: "#BBF7D0",
                flexDirection: "row",
                alignItems: "flex-start",
              }}
            >
              <Info
                color="#16A34A"
                size={20}
                style={{ marginRight: 12, marginTop: 2 }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#166534",
                    marginBottom: 4,
                  }}
                >
                  Your Data is Private
                </Text>
                <Text
                  style={{ fontSize: 13, color: "#166534", lineHeight: 18 }}
                >
                  All your goals, tasks, and progress are stored locally. We
                  don't share your data with anyone.
                </Text>
              </View>
            </View>
          </View>

          {/* Data Management Section */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: "#6B7280",
                marginBottom: 12,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Data Management
            </Text>

            {/* Delete All Data */}
            <TouchableOpacity
              onPress={handleDataDeletion}
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: "#FEE2E2",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#FEE2E2",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Trash2 color="#EF4444" size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#EF4444",
                    marginBottom: 2,
                  }}
                >
                  Delete All Data
                </Text>
                <Text style={{ fontSize: 13, color: "#6B7280" }}>
                  Permanently remove all your data
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* About Section */}
          <View>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: "#6B7280",
                marginBottom: 12,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              About
            </Text>

            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: "#6B7280",
                  lineHeight: 20,
                  marginBottom: 12,
                }}
              >
                Micro-Goals helps you achieve big dreams through small, daily
                actions. Break down your goals into 5-minute tasks and build
                lasting habits.
              </Text>
              <Text style={{ fontSize: 13, color: "#9CA3AF" }}>
                Version 1.0.0
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Flame, Trophy, Target } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";

// export default function StreaksScreen() - Duplicate, renamed
function StreaksScreen() {
  const insets = useSafeAreaInsets();

  // Fetch streak info
  const {
    data: streak,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["streak"],
    queryFn: async () => {
      const response = await fetch("/api/streaks");
      if (!response.ok) throw new Error("Failed to fetch streak");
      return response.json();
    },
  });

  return (
    <View
      style={{ flex: 1, backgroundColor: "#F9FAFB", paddingTop: insets.top }}
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 16,
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderBottomColor: "#E5E7EB",
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "700",
            color: "#111827",
            marginBottom: 4,
          }}
        >
          Your Streaks
        </Text>
        <Text style={{ fontSize: 15, color: "#6B7280" }}>
          Keep the momentum going!
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {isLoading ? (
          <View style={{ paddingTop: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : (
          <View style={{ paddingTop: 20, paddingHorizontal: 20 }}>
            {/* Current Streak Card */}
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 20,
                padding: 24,
                marginBottom: 16,
                borderWidth: 2,
                borderColor: streak?.current_streak > 0 ? "#F59E0B" : "#E5E7EB",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor:
                    streak?.current_streak > 0 ? "#FEF3C7" : "#F3F4F6",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Flame
                  color={streak?.current_streak > 0 ? "#F59E0B" : "#9CA3AF"}
                  size={40}
                />
              </View>
              <Text
                style={{
                  fontSize: 48,
                  fontWeight: "700",
                  color: "#111827",
                  marginBottom: 4,
                }}
              >
                {streak?.current_streak || 0}
              </Text>
              <Text style={{ fontSize: 16, color: "#6B7280", marginBottom: 8 }}>
                Day Streak
              </Text>
              {streak?.current_streak > 0 ? (
                <Text
                  style={{ fontSize: 14, color: "#10B981", fontWeight: "600" }}
                >
                  🎉 Keep it up!
                </Text>
              ) : (
                <Text style={{ fontSize: 14, color: "#9CA3AF" }}>
                  Complete a task to start your streak
                </Text>
              )}
            </View>

            {/* Stats Grid */}
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
              {/* Longest Streak */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  alignItems: "center",
                }}
              >
                <Trophy
                  color="#F59E0B"
                  size={32}
                  style={{ marginBottom: 12 }}
                />
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: "700",
                    color: "#111827",
                    marginBottom: 4,
                  }}
                >
                  {streak?.longest_streak || 0}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: "#6B7280",
                    textAlign: "center",
                  }}
                >
                  Longest Streak
                </Text>
              </View>

              {/* Total Tasks */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  alignItems: "center",
                }}
              >
                <Target
                  color="#3B82F6"
                  size={32}
                  style={{ marginBottom: 12 }}
                />
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: "700",
                    color: "#111827",
                    marginBottom: 4,
                  }}
                >
                  {streak?.total_tasks_completed || 0}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: "#6B7280",
                    textAlign: "center",
                  }}
                >
                  Tasks Done
                </Text>
              </View>
            </View>

            {/* Motivation Card */}
            <View
              style={{
                backgroundColor: "#EFF6FF",
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: "#DBEAFE",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#1E40AF",
                  marginBottom: 8,
                }}
              >
                💡 Streak Tips
              </Text>
              <Text style={{ fontSize: 14, color: "#1E40AF", lineHeight: 20 }}>
                • Complete at least one task daily to maintain your streak{"\n"}
                • Break big goals into 5-minute tasks{"\n"}• Set reminders to
                stay consistent{"\n"}• Small progress is still progress!
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { X, Plus } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";

// export default function AddGoalScreen() - Duplicate, renamed
function AddGoalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [tasks, setTasks] = useState(["", "", ""]);

  const paddingAnimation = useRef(
    new Animated.Value(insets.bottom + 12),
  ).current;

  const animateTo = (value) => {
    Animated.timing(paddingAnimation, {
      toValue: value,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleInputFocus = () => {
    if (Platform.OS === "web") return;
    animateTo(12);
  };

  const handleInputBlur = () => {
    if (Platform.OS === "web") return;
    animateTo(insets.bottom + 12);
  };

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: async ({ title, description, taskTitles }) => {
      // Create goal
      const goalResponse = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      if (!goalResponse.ok) throw new Error("Failed to create goal");
      const goal = await goalResponse.json();

      // Create tasks
      const taskPromises = taskTitles.map((taskTitle, index) =>
        fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            goal_id: goal.id,
            title: taskTitle,
            duration_minutes: 5,
            task_order: index,
          }),
        }),
      );
      await Promise.all(taskPromises);

      return goal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["goals"]);
      queryClient.invalidateQueries(["tasks"]);
      router.back();
    },
    onError: (error) => {
      Alert.alert("Error", "Failed to create goal. Please try again.");
      console.error(error);
    },
  });

  const handleAddTask = useCallback(() => {
    setTasks((prevTasks) => [...prevTasks, ""]);
  }, []);

  const handleUpdateTask = useCallback(
    (index, value) => {
      setTasks((prevTasks) => {
        const newTasks = [...prevTasks];
        newTasks[index] = value;
        return newTasks;
      });
    },
    [],
  );

  const handleRemoveTask = useCallback(
    (index) => {
      setTasks((prevTasks) => {
        if (prevTasks.length > 1) {
          return prevTasks.filter((_, i) => i !== index);
        }
        return prevTasks;
      });
    },
    [],
  );

  const handleSave = useCallback(() => {
    if (!goalTitle?.trim()) {
      Alert.alert("Missing Info", "Please enter a goal title");
      return;
    }

    const validTasks = tasks.filter((t) => t?.trim() !== "");
    if (validTasks.length === 0) {
      Alert.alert("Missing Info", "Please add at least one task");
      return;
    }

    createGoalMutation.mutate({
      title: goalTitle.trim(),
      description: goalDescription.trim() || undefined,
      taskTitles: validTasks,
    });
  }, [goalTitle, goalDescription, tasks, createGoalMutation]);

  return (
    <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
      <View
        style={{ flex: 1, backgroundColor: "#F9FAFB", paddingTop: insets.top }}
      >
        <StatusBar style="dark" />

        {/* Header */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 16,
            backgroundColor: "#fff",
            borderBottomWidth: 1,
            borderBottomColor: "#E5E7EB",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ padding: 4 }}
          >
            <X color="#111827" size={24} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "600", color: "#111827" }}>
            New Goal
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={createGoalMutation.isPending}
            style={{ padding: 4 }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: createGoalMutation.isPending ? "#9CA3AF" : "#3B82F6",
              }}
            >
              {createGoalMutation.isPending ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        <Animated.ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: paddingAnimation }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ padding: 20 }}>
            {/* Goal Title */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: 8,
                }}
              >
                What's your big goal?
              </Text>
              <TextInput
                value={goalTitle}
                onChangeText={setGoalTitle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="e.g., Learn Spanish, Get fit, Write a book"
                placeholderTextColor="#9CA3AF"
                style={{
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 16,
                  color: "#111827",
                }}
              />
            </View>

            {/* Goal Description */}
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: 8,
                }}
              >
                Description (optional)
              </Text>
              <TextInput
                value={goalDescription}
                onChangeText={setGoalDescription}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="Why is this goal important to you?"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 16,
                  color: "#111827",
                  minHeight: 80,
                  textAlignVertical: "top",
                }}
              />
            </View>

            {/* Micro-Tasks */}
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: 8,
                }}
              >
                Break it into 5-minute tasks
              </Text>
              <Text
                style={{ fontSize: 13, color: "#6B7280", marginBottom: 12 }}
              >
                Small actions you can do daily to reach your goal
              </Text>

              {tasks.map((task, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <TextInput
                    value={task}
                    onChangeText={(value) => handleUpdateTask(index, value)}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholder={`Task ${index + 1}`}
                    placeholderTextColor="#9CA3AF"
                    style={{
                      flex: 1,
                      backgroundColor: "#fff",
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      borderRadius: 12,
                      padding: 14,
                      fontSize: 16,
                      color: "#111827",
                    }}
                  />
                  {tasks.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveTask(index)}
                      style={{ marginLeft: 8, padding: 8 }}
                    >
                      <X color="#EF4444" size={20} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <TouchableOpacity
                onPress={handleAddTask}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#F3F4F6",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 12,
                  padding: 14,
                  marginTop: 4,
                }}
              >
                <Plus color="#6B7280" size={20} />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 15,
                    fontWeight: "500",
                    color: "#6B7280",
                  }}
                >
                  Add Another Task
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.ScrollView>
      </View>
    </KeyboardAvoidingAnimatedView>
  );
}
import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  ChevronLeft,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
} from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// export default function GoalDetailScreen() - Duplicate, renamed
function GoalDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const queryClient = useQueryClient();
  const [completingId, setCompletingId] = useState(null);

  // Fetch goal with tasks
  const { data: goal, isLoading } = useQuery({
    queryKey: ["goal", id],
    queryFn: async () => {
      const response = await fetch(`/api/goals/${id}`);
      if (!response.ok) throw new Error("Failed to fetch goal");
      return response.json();
    },
  });

  // Complete task mutation
  const completeMutation = useMutation({
    mutationFn: async (taskId) => {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to complete task");
      return response.json();
    },
    onMutate: (taskId) => {
      setCompletingId(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["goal", id]);
      queryClient.invalidateQueries(["tasks"]);
      queryClient.invalidateQueries(["streak"]);
      setCompletingId(null);
    },
    onError: () => {
      setCompletingId(null);
    },
  });

  // Delete goal mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/goals/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete goal");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["goals"]);
      router.back();
    },
  });

  const handleCompleteTask = useCallback(
    (taskId) => {
      completeMutation.mutate(taskId);
    },
    [completeMutation],
  );

  const handleDeleteGoal = useCallback(() => {
    Alert.alert(
      "Delete Goal",
      "Are you sure you want to delete this goal and all its tasks?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate(),
        },
      ],
    );
  }, [deleteMutation]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#F9FAFB",
          paddingTop: insets.top,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const tasks = goal?.tasks || [];
  const pendingTasks = tasks.filter((t) => !t.completed_at);
  const completedTasks = tasks.filter((t) => t.completed_at);

  return (
    <View
      style={{ flex: 1, backgroundColor: "#F9FAFB", paddingTop: insets.top }}
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 16,
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderBottomColor: "#E5E7EB",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ padding: 4 }}
          >
            <ChevronLeft color="#111827" size={24} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteGoal} style={{ padding: 4 }}>
            <Trash2 color="#EF4444" size={20} />
          </TouchableOpacity>
        </View>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            color: "#111827",
            marginBottom: 4,
          }}
        >
          {goal?.title}
        </Text>
        {goal?.description && (
          <Text style={{ fontSize: 15, color: "#6B7280", lineHeight: 22 }}>
            {goal.description}
          </Text>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Pending Tasks */}
        {pendingTasks.length > 0 && (
          <View style={{ paddingTop: 20, paddingHorizontal: 20 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#374151",
                marginBottom: 12,
              }}
            >
              To Do ({pendingTasks.length})
            </Text>
            {pendingTasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                onPress={() => handleCompleteTask(task.id)}
                disabled={completingId === task.id}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                {completingId === task.id ? (
                  <ActivityIndicator
                    size="small"
                    color="#3B82F6"
                    style={{ marginRight: 12 }}
                  />
                ) : (
                  <Circle
                    color="#3B82F6"
                    size={22}
                    style={{ marginRight: 12 }}
                  />
                )}
                <Text style={{ flex: 1, fontSize: 15, color: "#111827" }}>
                  {task.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <View style={{ paddingTop: 20, paddingHorizontal: 20 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#374151",
                marginBottom: 12,
              }}
            >
              Completed ({completedTasks.length})
            </Text>
            {completedTasks.map((task) => (
              <View
                key={task.id}
                style={{
                  backgroundColor: "#F9FAFB",
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <CheckCircle2
                  color="#10B981"
                  size={22}
                  style={{ marginRight: 12 }}
                />
                <Text
                  style={{
                    flex: 1,
                    fontSize: 15,
                    color: "#6B7280",
                    textDecorationLine: "line-through",
                  }}
                >
                  {task.title}
                </Text>
              </View>
            ))}
          </View>
        )}

        {(!tasks || tasks.length === 0) && (
          <View
            style={{
              paddingTop: 60,
              paddingHorizontal: 20,
              alignItems: "center",
            }}
          >
            <Text
              style={{ fontSize: 16, color: "#9CA3AF", textAlign: "center" }}
            >
              No tasks yet for this goal
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
import { Redirect } from "expo-router";

// Duplicate Index function - commented out
// export default function Index() {
//   return <Redirect href="/(tabs)" />;
// }
/**
 * This file was generated by Anything. You may edit it but doing so may cause
 * issues in your app.
 */

import React, { useRef, useEffect } from 'react';
import { Platform, Keyboard, KeyboardAvoidingView } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const KeyboardAvoidingAnimatedView = (props, ref) => {
  const {
    children,
    behavior = Platform.OS === 'ios' ? 'padding' : 'height',
    keyboardVerticalOffset = 0,
    style,
    contentContainerStyle,
    enabled = true,
    onLayout,
    ...leftoverProps
  } = props;

  const animatedViewRef = useRef(null); // ref to animated view in this polyfill
  const initialHeightRef = useRef(0); // original height of animated view before keyboard appears
  const bottomRef = useRef(0); // current bottom offset value of animated view
  const bottomHeight = useSharedValue(0); // whats going to be added to the bottom when keyboard appears

  useEffect(() => {
    if (!enabled) return;

    const onKeyboardShow = (event) => {
      const { duration, endCoordinates } = event;
      const animatedView = animatedViewRef.current;

      if (!animatedView) return;

      let height = 0;

      // calculate how much the view needs to move up
      const keyboardY = endCoordinates.screenY - keyboardVerticalOffset;
      height = Math.max(animatedView.y + animatedView.height - keyboardY, 0);

      bottomHeight.value = withTiming(height, {
        duration: duration > 10 ? duration : 300,
      });
      bottomRef.current = height;
    };

    const onKeyboardHide = () => {
      bottomHeight.value = withTiming(0, { duration: 300 });
      bottomRef.current = 0;
    };

    Keyboard.addListener('keyboardWillShow', onKeyboardShow);
    Keyboard.addListener('keyboardWillHide', onKeyboardHide);

    return () => {
      Keyboard.removeAllListeners('keyboardWillShow');
      Keyboard.removeAllListeners('keyboardWillHide');
    };
  }, [keyboardVerticalOffset, enabled, bottomHeight]);

  const animatedStyle = useAnimatedStyle(() => {
    if (behavior === 'height') {
      return {
        height: Math.max(0, initialHeightRef.current - bottomHeight.value),
        flex: bottomHeight.value > 0 ? 0 : 1,
      };
    }
    if (behavior === 'padding') {
      return {
        paddingBottom: Math.max(0, bottomHeight.value),
      };
    }
    return {};
  });

  const positionAnimatedStyle = useAnimatedStyle(() => ({
    bottom: bottomHeight.value,
  }));

  const handleLayout = (event) => {
    const layout = event.nativeEvent.layout;
    animatedViewRef.current = layout;

    // initial height before keybaord appears
    if (!initialHeightRef.current) {
      initialHeightRef.current = layout.height;
    }

    if (onLayout) {
      onLayout(event);
    }
  };

  const renderContent = () => {
    if (behavior === 'position') {
      return (
        <Animated.View
          style={[
            contentContainerStyle,
            positionAnimatedStyle,
          ]}
        >
          {children}
        </Animated.View>
      );
    }
    // render children if padding or height
    return children;
  };

  // for web, default to unused keyboard avoiding view
  if (Platform.OS === 'web') {
    return (
      <KeyboardAvoidingView
        behavior={behavior}
        style={style}
        contentContainerStyle={contentContainerStyle}
        {...leftoverProps}
      >
        {children}
      </KeyboardAvoidingView>
    );
  }

  return (
    <Animated.View
      ref={ref}
      style={[style, animatedStyle]}
      onLayout={handleLayout}
      {...leftoverProps}
    >
      {renderContent()}
    </Animated.View>
  );
};

KeyboardAvoidingAnimatedView.displayName = 'KeyboardAvoidingAnimatedView';

// export default KeyboardAvoidingAnimatedView; - Duplicate, commented out
/**
 * This file was generated by Anything. You may edit it but doing so may cause
 * issues in your app.
 */
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useAuthStore } from './store';

const callbackUrl = '/api/auth/token';
const callbackQueryString = `callbackUrl=${callbackUrl}`;

/**
 * This renders a WebView for authentication and handles both web and native platforms.
 */
export const AuthWebView = ({ mode, proxyURL, baseURL }) => {
  const [currentURI, setURI] = useState(`${baseURL}/account/${mode}?${callbackQueryString}`);
  const { auth, setAuth, isReady } = useAuthStore();
  const isAuthenticated = isReady ? !!auth : null;
  const iframeRef = useRef(null);
  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }
    if (isAuthenticated) {
      router.back();
    }
  }, [isAuthenticated, router]);
  useEffect(() => {
    if (isAuthenticated) {
      return;
    }
    setURI(`${baseURL}/account/${mode}?${callbackQueryString}`);
  }, [mode, baseURL, isAuthenticated]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.addEventListener) {
      return;
    }
    const handleMessage = (event) => {
      // Verify the origin for security
      const allowedOrigin = process.env.EXPO_PUBLIC_PROXY_BASE_URL || process.env.EXPO_PUBLIC_BASE_URL;
      if (!allowedOrigin || event.origin !== allowedOrigin) {
        return;
      }
      if (event.data?.type === 'AUTH_SUCCESS') {
        setAuth({
          jwt: event.data.jwt,
          user: event.data.user,
        });
      } else if (event.data?.type === 'AUTH_ERROR') {
        console.error('Auth error:', event.data.error);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [setAuth]);

  if (Platform.OS === 'web') {
    const handleIframeError = () => {
      console.error('Failed to load auth iframe');
    };

    return (
      <iframe
        ref={iframeRef}
        title="Authentication"
        src={`${proxyURL}/account/${mode}?callbackUrl=/api/auth/expo-web-success`}
        style={{ width: '100%', height: '100%', border: 'none' }}
        onError={handleIframeError}
      />
    );
  }
  return (
    <WebView
      sharedCookiesEnabled
      source={{
        uri: currentURI,
      }}
      headers={{
        'x-createxyz-project-group-id': process.env.EXPO_PUBLIC_PROJECT_GROUP_ID,
        host: process.env.EXPO_PUBLIC_HOST,
        'x-forwarded-host': process.env.EXPO_PUBLIC_HOST,
        'x-createxyz-host': process.env.EXPO_PUBLIC_HOST,
      }}
      onShouldStartLoadWithRequest={(request) => {
        if (request.url === `${baseURL}${callbackUrl}`) {
          fetch(request.url).then(async (response) => {
            response.json().then((data) => {
              setAuth({ jwt: data.jwt, user: data.user });
            });
          });
          return false;
        }
        if (request.url === currentURI) return true;

        // Add query string properly by checking if URL already has parameters
        const hasParams = request.url.includes('?');
        const separator = hasParams ? '&' : '?';
        const newURL = request.url.replaceAll(proxyURL, baseURL);
        if (newURL.endsWith(callbackUrl)) {
          setURI(newURL);
          return false;
        }
        setURI(`${newURL}${separator}${callbackQueryString}`);
        return false;
      }}
      style={{ flex: 1 }}
    />
  );
};
/**
 * This file was generated by Anything. You may edit it but doing so may cause
 * issues in your app.
 */
import { useAuth, useRequireAuth } from './useAuth';
export { useUser } from './useUser';

export { useAuth, useRequireAuth };
// export default useAuth;
/**
 * This file was generated by Anything. You may edit it but doing so may cause
 * issues in your app.
 */
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export const authKey = `${process.env.EXPO_PUBLIC_PROJECT_GROUP_ID}-jwt`;

/**
 * This store manages the authentication state of the application.
 */
export const useAuthStore = create((set) => ({
  isReady: false,
  auth: null,
  setAuth: (auth) => {
    if (auth) {
      SecureStore.setItemAsync(authKey, JSON.stringify(auth));
    } else {
      SecureStore.deleteItemAsync(authKey);
    }
    set({ auth });
  },
}));

/**
 * This store manages the state of the authentication modal.
 */
export const useAuthModal = create((set) => ({
  isOpen: false,
  mode: 'signup',
  open: (options) => set({ isOpen: true, mode: options?.mode || 'signup' }),
  close: () => set({ isOpen: false }),
}));
/**
 * This file was generated by Anything. You may edit it but doing so may cause
 * issues in your app.
 */
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { Modal, View } from 'react-native';
import { useAuthModal, useAuthStore, authKey } from './store';


/**
 * This hook provides authentication functionality.
 * It may be easier to use the `useAuthModal` or `useRequireAuth` hooks
 * instead as those will also handle showing authentication to the user
 * directly.
 */
export const useAuth = () => {
  const { isReady, auth, setAuth } = useAuthStore();
  const { isOpen, close, open } = useAuthModal();

  const initiate = useCallback(async () => {
    try {
      const auth = await SecureStore.getItemAsync(authKey);
      useAuthStore.setState({
        auth: auth ? JSON.parse(auth) : null,
        isReady: true,
      });
    } catch (error) {
      console.error('Failed to retrieve auth:', error);
      useAuthStore.setState({
        auth: null,
        isReady: true,
      });
    }
  }, []);

  const signIn = useCallback(() => {
    open({ mode: 'signin' });
  }, [open]);
  const signUp = useCallback(() => {
    open({ mode: 'signup' });
  }, [open]);

  const signOut = useCallback(() => {
    setAuth(null);
    close();
  }, [setAuth, close]);

  return {
    isReady: isReady ?? false,
    isAuthenticated: isReady ? !!auth : null,
    signIn,
    signOut,
    signUp,
    auth: auth ?? null,
    setAuth,
    initiate,
  };
};

/**
 * This hook will automatically open the authentication modal if the user is not authenticated.
 */
export const useRequireAuth = (options) => {
  const { isAuthenticated, isReady } = useAuth();
  const { open } = useAuthModal();

  useEffect(() => {
    if (!isAuthenticated && isReady) {
      open({ mode: options?.mode });
    }
  }, [isAuthenticated, open, options?.mode, isReady]);
};

// export default useAuth; - Duplicate removed
/**
 * This file was generated by Anything. You may edit it but doing so may cause
 * issues in your app.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Modal, View } from 'react-native';
import { create } from 'zustand';
import { useCallback, useMemo } from 'react';
import { AuthWebView } from './AuthWebView';
import { useAuthStore, useAuthModal } from './store';


/**
 * This component renders a modal for authentication purposes.
 * To show it programmatically, you should either use the `useRequireAuth` hook or the `useAuthModal` hook.
 *
 * @example
 * ```js
 * import { useAuthModal } from '@/utils/useAuthModal';
 * function MyComponent() {
 * const { open } = useAuthModal();
 * return <Button title="Login" onPress={() => open({ mode: 'signin' })} />;
 * }
 * ```
 *
 * @example
 * ```js
 * import { useRequireAuth } from '@/utils/useAuth';
 * function MyComponent() {
 *   // automatically opens the auth modal if the user is not authenticated
 *   useRequireAuth();
 *   return <Text>Protected Content</Text>;
 * }
 *
 */
export const AuthModal = () => {
  const { isOpen, mode } = useAuthModal();
  const { auth } = useAuthStore();

  const snapPoints = useMemo(() => ['100%'], []);
  const proxyURL = process.env.EXPO_PUBLIC_PROXY_BASE_URL;
  const baseURL = process.env.EXPO_PUBLIC_BASE_URL;
  if (!proxyURL && !baseURL) {
    return null;
  }

  return (
    <Modal
      visible={isOpen && !auth}
      transparent={true}
      animationType="slide"
    >
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '100%',
          width: '100%',
          backgroundColor: '#fff',
          padding: 0,
        }}
      >
        <AuthWebView
          mode={mode}
          proxyURL={proxyURL}
          baseURL={baseURL}
        />
      </View>
    </Modal>
  );
};

// export default useAuthModal; - Duplicate, commented out
/**
 * This file was generated by Anything. You may edit it but doing so may cause
 * issues in your app.
 */
import { useCallback } from 'react';
import { useAuth } from './useAuth';

// export const useUser = () => { - Duplicate, commented out and renamed
const useUserFunc = () => {
	const { auth, isReady } = useAuth();
	const user = auth?.user || null;
	const fetchUser = useCallback(async () => {
		return user;
	}, [user]);
	return { user, data: user, loading: !isReady, refetch: fetchUser };
};
/**
 * This file was generated by Anything. You may edit it but doing so may cause
 * issues in your app.
 */
import * as React from 'react';

  function useHandleStreamResponse({
  onChunk,
  onFinish
}) {
  const handleStreamResponse = React.useCallback(
    async (response) => {
      if (response.body) {
        const reader = response.body.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          let content = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              onFinish(content);
              break;
            }
            const chunk = decoder.decode(value, { stream: true });
            content += chunk;
            onChunk(content);
          }
        }
      }
    },
    [onChunk, onFinish]
  );
  const handleStreamResponseRef = React.useRef(handleStreamResponse);
  React.useEffect(() => {
    handleStreamResponseRef.current = handleStreamResponse;
  }, [handleStreamResponse]);
  return React.useCallback((response) => handleStreamResponseRef.current(response), []); 
}

  // export default useHandleStreamResponse; - Duplicate, commented out
  /**
 * This file was generated by Anything. You may edit it but doing so may cause
 * issues in your app.
 */
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { BackHandler } from 'react-native';

export const usePreventBack = () => {
	const navigation = useNavigation();

	useFocusEffect(() => {
		navigation.setOptions({
			headerLeft: () => null,
			gestureEnabled: false,
		});

		navigation.getParent()?.setOptions({ gestureEnabled: false });

		// Android back button handler
		const hardwareBackPressHandler = BackHandler.addEventListener(
			'hardwareBackPress',
			() => {
				// Prevent default behavior of leaving the screen
				return true;
			}
		);

		return () => {
			navigation.getParent()?.setOptions({ gestureEnabled: true });
			navigation.setOptions({
				gestureEnabled: true,
			});
			hardwareBackPressHandler.remove();
		};
	});
};
// export default usePreventBack; - Duplicate, commented out
/**
 * This file was generated by Anything. You may edit it but doing so may cause
 * issues in your app.
 */
import * as React from 'react';
import { UploadClient } from '@uploadcare/upload-client'
const client = new UploadClient({ publicKey: process.env.EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY });

function useUpload() {
  const [loading, setLoading] = React.useState(false);
  const upload = React.useCallback(async (input) => {
    try {
      setLoading(true);
      let response;

      if ("reactNativeAsset" in input && input.reactNativeAsset) {
        let asset = input.reactNativeAsset;

        if (asset.file) {
          const formData = new FormData();
          formData.append("file", asset.file);

          response = await fetch("/_create/api/upload/", {
            method: "POST",
            body: formData,
          });
        } else {
          // Fallback to presigned Uploadcare upload
          const presignRes = await fetch("/_create/api/upload/presign/", {
            method: "POST",
          });
          const { secureSignature, secureExpire } = await presignRes.json();

          const result = await client.uploadFile(asset, {
            fileName: asset.name ?? asset.uri.split("/").pop(),
            contentType: asset.mimeType,
            secureSignature,
            secureExpire
          });
          return { url: `${process.env.EXPO_PUBLIC_BASE_CREATE_USER_CONTENT_URL}/${result.uuid}/`, mimeType: result.mimeType || null };
        }
      } else if ("url" in input) {
        response = await fetch("/_create/api/upload/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ url: input.url })
        });
      } else if ("base64" in input) {
        response = await fetch("/_create/api/upload/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ base64: input.base64 })
        });
      } else {
        response = await fetch("/_create/api/upload/", {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream"
          },
          body: input.buffer
        });
      }
      if (!response.ok) {
        if (response.status === 413) {
          throw new Error("Upload failed: File too large.");
        }
        throw new Error("Upload failed");
      }
      const data = await response.json();
      return { url: data.url, mimeType: data.mimeType || null };
    } catch (uploadError) {
      if (uploadError instanceof Error) {
        return { error: uploadError.message };
      }
      if (typeof uploadError === "string") {
        return { error: uploadError };
      }
      return { error: "Upload failed" };
    } finally {
      setLoading(false);
    }
  }, []);

  return [upload, { loading }];
}

export { useUpload };
// export default useUpload; - Duplicate removed
/**
 * This file was generated by Anything. You may edit it but doing so may cause
 * issues in your app.
 */
import { getToken } from '@auth/core/jwt';
export async function GET(request) {
	const [token, jwt] = await Promise.all([
		getToken({
			req: request,
			secret: process.env.AUTH_SECRET,
			secureCookie: process.env.AUTH_URL.startsWith('https'),
			raw: true,
		}),
		getToken({
			req: request,
			secret: process.env.AUTH_SECRET,
			secureCookie: process.env.AUTH_URL.startsWith('https'),
		}),
	]);

	if (!jwt) {
		return new Response(
			`
			<html>
				<body>
					<script>
						window.parent.postMessage({ type: 'AUTH_ERROR', error: 'Unauthorized' }, '*');
					</script>
				</body>
			</html>
			`,
			{
				status: 401,
				headers: {
					'Content-Type': 'text/html',
				},
			}
		);
	}

	const message = {
		type: 'AUTH_SUCCESS',
		jwt: token,
		user: {
			id: jwt.sub,
			email: jwt.email,
			name: jwt.name,
		},
	};

	return new Response(
		`
		<html>
			<body>
				<script>
					window.parent.postMessage(${JSON.stringify(message)}, '*');
				</script>
			</body>
		</html>
		`,
		{
			headers: {
				'Content-Type': 'text/html',
			},
		}
	);
}
/**
 * This file was generated by Anything. You may edit it but doing so may cause
 * issues in your app.
 */
import { getToken } from '@auth/core/jwt';
export async function GET(request) {
	const [token, jwt] = await Promise.all([
		getToken({
			req: request,
			secret: process.env.AUTH_SECRET,
			secureCookie: process.env.AUTH_URL.startsWith('https'),
			raw: true,
		}),
		getToken({
			req: request,
			secret: process.env.AUTH_SECRET,
			secureCookie: process.env.AUTH_URL.startsWith('https'),
		}),
	]);

	if (!jwt) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}

	return new Response(
		JSON.stringify({
			jwt: token,
			user: {
				id: jwt.sub,
				email: jwt.email,
				name: jwt.name,
			},
		}),
		{
			headers: {
				'Content-Type': 'application/json',
			},
		}
	);
}
import sql from "@/app/api/utils/sql";

// Create a new goal
export async function POST(request) {
  try {
    const { title, description } = await request.json();

    if (!title || title.trim() === "") {
      return Response.json({ error: "Title is required" }, { status: 400 });
    }

    const [goal] = await sql`
      INSERT INTO goals (title, description)
      VALUES (${title.trim()}, ${description || null})
      RETURNING *
    `;

    return Response.json(goal);
  } catch (error) {
    console.error("Error creating goal:", error);
    return Response.json({ error: "Failed to create goal" }, { status: 500 });
  }
}

// Get all active goals with their tasks
export async function GET() {
  try {
    const goals = await sql`
      SELECT 
        g.*,
        COUNT(mt.id) FILTER (WHERE mt.completed_at IS NULL) as pending_tasks,
        COUNT(mt.id) FILTER (WHERE mt.completed_at IS NOT NULL) as completed_tasks
      FROM goals g
      LEFT JOIN micro_tasks mt ON g.id = mt.goal_id
      WHERE g.is_active = true
      GROUP BY g.id
      ORDER BY g.created_at DESC
    `;

    return Response.json(goals);
  } catch (error) {
    console.error("Error fetching goals:", error);
    return Response.json({ error: "Failed to fetch goals" }, { status: 500 });
  }
}
import sql from "@/app/api/utils/sql";

// Get current streak info
export async function GET() {
  try {
    const [streak] = await sql`
      SELECT * FROM streaks ORDER BY id LIMIT 1
    `;

    if (!streak) {
      // Initialize if doesn't exist
      const [newStreak] = await sql`
        INSERT INTO streaks (current_streak, longest_streak, total_tasks_completed)
        VALUES (0, 0, 0)
        RETURNING *
      `;
      return Response.json(newStreak);
    }

    return Response.json(streak);
  } catch (error) {
    console.error("Error fetching streak:", error);
    return Response.json({ error: "Failed to fetch streak" }, { status: 500 });
  }
}
import sql from "@/app/api/utils/sql";

// Create a new micro-task
export async function POST(request) {
  try {
    const { goal_id, title, duration_minutes, scheduled_for } =
      await request.json();

    if (!title || title.trim() === "") {
      return Response.json({ error: "Title is required" }, { status: 400 });
    }

    const [task] = await sql`
      INSERT INTO micro_tasks (goal_id, title, duration_minutes, scheduled_for)
      VALUES (${goal_id || null}, ${title.trim()}, ${duration_minutes || 5}, ${scheduled_for || null})
      RETURNING *
    `;

    return Response.json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    return Response.json({ error: "Failed to create task" }, { status: 500 });
  }
}

// Get today's tasks
export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await sql`
      SELECT 
        mt.*,
        g.title as goal_title,
        g.description as goal_description
      FROM micro_tasks mt
      LEFT JOIN goals g ON mt.goal_id = g.id
      WHERE mt.completed_at IS NULL
        AND (mt.scheduled_for IS NULL OR mt.scheduled_for < ${tomorrow.toISOString()})
      ORDER BY mt.scheduled_for ASC NULLS FIRST, mt.created_at ASC
      LIMIT 20
    `;

    return Response.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return Response.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}
/**
 * This file was generated by Anything. You may edit it but doing so may cause
 * issues in your app.
 */
import { neon } from '@neondatabase/serverless';

const NullishQueryFunction = () => {
  throw new Error(
    'No database connection string was provided to `neon()`. Perhaps process.env.DATABASE_URL has not been set'
  );
};
NullishQueryFunction.transaction = () => {
  throw new Error(
    'No database connection string was provided to `neon()`. Perhaps process.env.DATABASE_URL has not been set'
  );
};
const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : NullishQueryFunction;

// export default sql; - Duplicate, commented out
/**
 * This file was generated by Anything. You may edit it but doing so may cause
 * issues in your app.
 */
async function upload({
  url,
  buffer,
  base64
}) {
  const response = await fetch(`https://api.createanything.com/v0/upload`, {
    method: "POST",
    headers: {
      "Content-Type": buffer ? "application/octet-stream" : "application/json"
    },
    body: buffer ? buffer : JSON.stringify({ base64, url })
  });
  const data = await response.json();
  return {
    url: data.url,
    mimeType: data.mimeType || null
  };
}
export { upload };
// export default upload; - Duplicate removed
/**
 * This file was generated by Anything. You may edit it but doing so may cause
 * issues in your app.
 */
async function upload({
  url,
  buffer,
  base64
}) {
  const response = await fetch(`https://api.createanything.com/v0/upload`, {
    method: "POST",
    headers: {
      "Content-Type": buffer ? "application/octet-stream" : "application/json"
    },
    body: buffer ? buffer : JSON.stringify({ base64, url })
  });
  const data = await response.json();
  return {
    url: data.url,
    mimeType: data.mimeType || null
  };
}
export { upload };
// Second export default upload removed - Duplicate
/**
 * This file was generated by Anything. You may edit it but doing so may cause
 * issues in your app.
 */
import { useCallback } from 'react';
import { signIn, signOut } from "@auth/create/react";

function useAuth() {
  const callbackUrl = typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search).get('callbackUrl')
    : null;

  const signInWithCredentials = useCallback((options) => {
    return signIn("credentials-signin", {
      ...options,
      callbackUrl: callbackUrl ?? options.callbackUrl
    });
  }, [callbackUrl])

  const signUpWithCredentials = useCallback((options) => {
    return signIn("credentials-signup", {
      ...options,
      callbackUrl: callbackUrl ?? options.callbackUrl
    });
  }, [callbackUrl])

  const signInWithGoogle = useCallback((options) => {
    return signIn("google", {
      ...options,
      callbackUrl: callbackUrl ?? options.callbackUrl
    });
  }, [callbackUrl]);
  const signInWithFacebook = useCallback((options) => {
    return signIn("facebook", options);
  }, []);
  const signInWithTwitter = useCallback((options) => {
    return signIn("twitter", options);
  }, []);
  const signInWithApple = useCallback((options) => {
    return signIn("apple", {
      ...options,
      callbackUrl: callbackUrl ?? options.callbackUrl
    });
  }, [callbackUrl]);

  return {
    signInWithCredentials,
    signUpWithCredentials,
    signInWithGoogle,
    signInWithFacebook,
    signInWithTwitter,
    signInWithApple,
    signOut,
  }
}

// export default useAuth; - Duplicate removed
/**
 * This file was generated by Anything. You may edit it but doing so may cause
 * issues in your app.
 */
import * as React from 'react';

function useHandleStreamResponse({
  onChunk,
  onFinish
}) {
  const handleStreamResponse = React.useCallback(
    async (response) => {
      if (response.body) {
        const reader = response.body.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          let content = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              onFinish(content);
              break;
            }
            const chunk = decoder.decode(value, { stream: true });
            content += chunk;
            onChunk(content);
          }
        }
      }
    },
    [onChunk, onFinish]
  );
  const handleStreamResponseRef = React.useRef(handleStreamResponse);
  React.useEffect(() => {
    handleStreamResponseRef.current = handleStreamResponse;
  }, [handleStreamResponse]);
  return React.useCallback((response) => handleStreamResponseRef.current(response), []); 
}

// export default useHandleStreamResponse; - Duplicate removed
/**
 * This file was generated by Anything. You may edit it but doing so may cause
 * issues in your app.
 */
import * as React from 'react';

function useUpload() {
  const [loading, setLoading] = React.useState(false);
  const upload = React.useCallback(async (input) => {
    try {
      setLoading(true);
      let response;
      if ("file" in input && input.file) {
        const formData = new FormData();
        formData.append("file", input.file);
        response = await fetch("/_create/api/upload/", {
          method: "POST",
          body: formData
        });
      } else if ("url" in input) {
        response = await fetch("/_create/api/upload/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ url: input.url })
        });
      } else if ("base64" in input) {
        response = await fetch("/_create/api/upload/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ base64: input.base64 })
        });
      } else {
        response = await fetch("/_create/api/upload/", {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream"
          },
          body: input.buffer
        });
      }
      if (!response.ok) {
        if (response.status === 413) {
          throw new Error("Upload failed: File too large.");
        }
        throw new Error("Upload failed");
      }
      const data = await response.json();
      return { url: data.url, mimeType: data.mimeType || null };
    } catch (uploadError) {
      if (uploadError instanceof Error) {
        return { error: uploadError.message };
      }
      if (typeof uploadError === "string") {
        return { error: uploadError };
      }
      return { error: "Upload failed" };
    } finally {
      setLoading(false);
    }
  }, []);

  return [upload, { loading }];
}

export { useUpload };
// export default useUpload; - Duplicate removed
/**
 * This file was generated by Anything. You may edit it but doing so may cause
 * issues in your app.
 */
import * as React from 'react';
import { useSession } from "@auth/create/react";

// Converted from TypeScript to JavaScript
const useUserWeb = () => {
  const { data: session, status } = useSession();

  const [user, setUser] = React.useState(session?.user ?? null);

  const fetchUser = React.useCallback(async (s) => {
    return s?.user ?? null;
  }, []);

  const refetchUser = React.useCallback(async () => {
    const env = String(process.env.NEXT_PUBLIC_CREATE_ENV || '').toLowerCase();
    const id = session?.user?.id;
    if (env === 'production') {
      if (id) {
        const u = await fetchUser(session);
        setUser(u ?? null);
      } else {
        setUser(null);
      }
    }
  }, [fetchUser, session]);

  React.useEffect(() => {
    void refetchUser();
  }, [refetchUser]);

  const env = String(process.env.NEXT_PUBLIC_CREATE_ENV || '').toLowerCase();
  if (env !== 'production') {
    return { user, data: session?.user ?? null, loading: status === 'loading', refetch: refetchUser };
  }
  return { user, data: user, loading: status === 'loading' || (status === 'authenticated' && !user), refetch: refetchUser };
};

// Removed duplicate useUser export