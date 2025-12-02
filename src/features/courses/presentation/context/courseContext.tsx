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
import { GetCoursesByStudentUseCase } from "../../domain/usecases/GetCoursesByStudentUseCase";
import { GetCoursesByTeacherUseCase } from "../../domain/usecases/GetCoursesByTeacherUseCase";

type CourseContextType = {
  courses: Course[];
  isLoading: boolean;
  error: string | null;
  addCourse: (course: NewCourse, userId: string) => Promise<void>;
  getCourse: (id: string) => Promise<Course | undefined>;
  getCoursesByTeacher: (teacherId: string) => Promise<void>;
  getCoursesByStudent: (studentId: string) => Promise<void>;
  getAllCourses: (userId: string) => Promise<void>;
  refreshCourses: (userId: string) => Promise<void>;
};

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export function CourseProvider({ children }: { children: ReactNode }) {
  const di = useDI();

  const addCourseUC = di.resolve<AddCourseUseCase>(TOKENS.AddCourseUC);
  const getCourseByIdUC = di.resolve<GetCourseByIdUseCase>(TOKENS.GetCourseByIdUC);
  const getCoursesByTeacherUC = di.resolve<GetCoursesByTeacherUseCase>(TOKENS.GetCoursesByTeacherUC);
  const getCoursesByStudentUC = di.resolve<GetCoursesByStudentUseCase>(TOKENS.GetCoursesByStudentUC);

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

  const getCoursesByStudent = async (studentId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const list = await getCoursesByStudentUC.execute(studentId);
      setCourses(list);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const getAllCourses = async (userId: string) => {
    console.log('[CourseContext] getAllCourses called with userId:', userId);
    try {
      setIsLoading(true);
      setError(null);
      console.log('[CourseContext] Fetching courses...');
      
      // Obtener cursos como profesor y como estudiante
      const [teacherCourses, studentCourses] = await Promise.all([
        getCoursesByTeacherUC.execute(userId),
        getCoursesByStudentUC.execute(userId),
      ]);
      
      console.log('[CourseContext] Teacher courses:', teacherCourses);
      console.log('[CourseContext] Student courses:', studentCourses);
      
      // Combinar y eliminar duplicados (por si acaso)
      const allCourses = [...teacherCourses];
      studentCourses.forEach(course => {
        const exists = allCourses.some(c => (c.id || c._id) === (course.id || course._id));
        if (!exists) {
          allCourses.push(course);
        }
      });
      
      console.log('[CourseContext] Total courses:', allCourses.length, allCourses);
      setCourses(allCourses);
    } catch (e) {
      console.error('[CourseContext] Error fetching courses:', e);
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCourses = async (userId: string) => {
    await getAllCourses(userId);
  };

  const addCourse = async (course: NewCourse, userId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('[CourseContext] Creating course:', course);
      await addCourseUC.execute(course);
      console.log('[CourseContext] Course created successfully, refreshing list...');
      // Recargar la lista de cursos después de crear uno nuevo
      await getAllCourses(userId);
    } catch (e) {
      console.error('[CourseContext] Error creating course:', e);
      setError((e as Error).message);
      throw e; // Re-lanzar el error para que AddCourseScreen pueda manejarlo
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
      getCoursesByStudent,
      getAllCourses,
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
