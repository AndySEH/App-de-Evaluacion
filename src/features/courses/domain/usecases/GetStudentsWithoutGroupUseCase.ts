import { AuthUser } from "../../../auth/domain/entities/AuthUser";
import { UserRepository } from "../../../auth/domain/repositories/UserRepository";
import { CourseRepository } from "../repositories/CourseRepository";
import { GroupRepository } from "../repositories/GroupRepository";

export class GetStudentsWithoutGroupUseCase {
  constructor(
    private courseRepository: CourseRepository,
    private groupRepository: GroupRepository,
    private userRepository: UserRepository
  ) {}

  async execute(courseId: string, categoryId: string): Promise<AuthUser[]> {
    // 1. Obtener todos los estudiantes del curso
    const course = await this.courseRepository.getCourseById(courseId);
    if (!course || !course.studentIds || course.studentIds.length === 0) {
      return [];
    }

    const allStudents = await this.userRepository.getUsersByIds(course.studentIds);
    console.log('[GetStudentsWithoutGroupUseCase] Total students in course:', allStudents.length, allStudents);

    // 2. Obtener todos los grupos de la categoría
    const groups = await this.groupRepository.getGroupsByCategory(categoryId);

    // 3. Recopilar todos los IDs de estudiantes que ya están en grupos
    const studentsInGroups = new Set<string>();
    groups.forEach(group => {
      // Parse memberIds if it's a string (from API)
      let memberIds: string[] = [];
      if (typeof group.memberIds === 'string') {
        try {
          memberIds = JSON.parse(group.memberIds);
        } catch {
          memberIds = [];
        }
      } else if (Array.isArray(group.memberIds)) {
        memberIds = group.memberIds;
      }

      memberIds.forEach(memberId => {
        if (memberId) {
          studentsInGroups.add(memberId);
        }
      });
    });

    // Obtener lista de estudiantes que están en grupos
    const studentsWithGroup = allStudents.filter(student => {
      const userId = student.userId;
      return userId && studentsInGroups.has(userId);
    });
    console.log('[GetStudentsWithoutGroupUseCase] Students with group:', studentsWithGroup.length, studentsWithGroup);

    // 4. Filtrar estudiantes que NO están en ningún grupo
    const studentsWithoutGroup = allStudents.filter(student => {
      const userId = student.userId;
      return userId && !studentsInGroups.has(userId);
    });
    console.log('[GetStudentsWithoutGroupUseCase] Students without group:', studentsWithoutGroup.length, studentsWithoutGroup);

    return studentsWithoutGroup;
  }
}
