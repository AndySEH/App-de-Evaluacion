import {
    createContext,
    ReactNode,
    useContext,
    useMemo,
    useState,
} from "react";

import { useDI } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Course, NewCourse } from "@/src/features/courses/domain/entities/Course";
import { AddCourseUseCase } from "../../domain/usecases/AddCourseUseCase";
import { GetCourseByIdUseCase } from "../../domain/usecases/GetCourseByIdUseCase";
import { GetCoursesByTeacherUseCase } from "../../domain/usecases/GetCoursesByTeacherUseCase";

type CourseContextType = {
  courses: Course[];
  isLoading: boolean;
  error: string | null;
  addCourse: (course: NewCourse) => Promise<void>;
  getCourse: (id: string) => Promise<Course | undefined>;
  getCoursesByTeacher: (teacherId: string) => Promise<void>;
  refreshCourses: (teacherId: string) => Promise<void>;
};

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export function CourseProvider({ children }: { children: ReactNode }) {
  const di = useDI();

  const addCourseUC = di.resolve<AddCourseUseCase>(TOKENS.AddCourseUC);
  const getCourseByIdUC = di.resolve<GetCourseByIdUseCase>(TOKENS.GetCourseByIdUC);
  const getCoursesByTeacherUC = di.resolve<GetCoursesByTeacherUseCase>(TOKENS.GetCoursesByTeacherUC);

  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCoursesByTeacher = async (teacherId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const list = await getCoursesByTeacherUC.execute(teacherId);
      setCourses(list);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCourses = async (teacherId: string) => {
    await getCoursesByTeacher(teacherId);
  };

  const addCourse = async (course: NewCourse) => {
    try {
      setIsLoading(true);
      setError(null);
      await addCourseUC.execute(course);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const getCourse = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      return await getCourseByIdUC.execute(id);
    } catch (e) {
      setError((e as Error).message);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

  const value = useMemo(
    () => ({
      courses,
      isLoading,
      error,
      addCourse,
      getCourse,
      getCoursesByTeacher,
      refreshCourses,
    }),
    [courses, isLoading, error]
  );

  return (
    <CourseContext.Provider value={value}>{children}</CourseContext.Provider>
  );
}

export function useCourses() {
  const ctx = useContext(CourseContext);
  if (!ctx) {
    throw new Error("useCourses must be used inside CourseProvider");
  }
  return ctx;
}
