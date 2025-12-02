export const TOKENS = {
  // Auth
  AuthRemoteDS: Symbol("AuthRemoteDS"),
  AuthRepo: Symbol("AuthRepo"),
  LoginUC: Symbol("LoginUC"),
  SignupUC: Symbol("SignupUC"),
  LogoutUC: Symbol("LogoutUC"),
  GetCurrentUserUC: Symbol("GetCurrentUserUC"),
  
  // User
  UserRemoteDS: Symbol("UserRemoteDS"),
  UserRepo: Symbol("UserRepo"),
  UpdateUserUC: Symbol("UpdateUserUC"),
  GetUserByIdUC: Symbol("GetUserByIdUC"),
  GetUsersByIdsUC: Symbol("GetUsersByIdsUC"),

  // Courses
  CourseRemoteDS: Symbol("CourseRemoteDS"),
  CourseRepo: Symbol("CourseRepo"),
  GetCoursesByTeacherUC: Symbol("GetCoursesByTeacherUC"),
  GetCoursesByStudentUC: Symbol("GetCoursesByStudentUC"),
  GetCourseByIdUC: Symbol("GetCourseByIdUC"),
  AddCourseUC: Symbol("AddCourseUC"),

  // Categories
  CategoryRemoteDS: Symbol("CategoryRemoteDS"),
  CategoryRepo: Symbol("CategoryRepo"),
  GetCategoriesByCourseUC: Symbol("GetCategoriesByCourseUC"),
  GetCategoryByIdUC: Symbol("GetCategoryByIdUC"),
  AddCategoryUC: Symbol("AddCategoryUC"),
  UpdateCategoryUC: Symbol("UpdateCategoryUC"),
  DeleteCategoryUC: Symbol("DeleteCategoryUC"),

  // Groups
  GroupRemoteDS: Symbol("GroupRemoteDS"),
  GroupRepo: Symbol("GroupRepo"),
  GetGroupsByCategoryUC: Symbol("GetGroupsByCategoryUC"),
  GetGroupsCountByCategoryUC: Symbol("GetGroupsCountByCategoryUC"),
  GetGroupByIdUC: Symbol("GetGroupByIdUC"),
  AddGroupUC: Symbol("AddGroupUC"),
  UpdateGroupUC: Symbol("UpdateGroupUC"),
  DeleteGroupUC: Symbol("DeleteGroupUC"),
  GetStudentsWithoutGroupUC: Symbol("GetStudentsWithoutGroupUC"),

  // Activities
  ActivityRemoteDS: Symbol("ActivityRemoteDS"),
  ActivityRepo: Symbol("ActivityRepo"),
  GetActivitiesByCourseUC: Symbol("GetActivitiesByCourseUC"),
  GetActivitiesCountByCourseUC: Symbol("GetActivitiesCountByCourseUC"),
  GetActivityByIdUC: Symbol("GetActivityByIdUC"),
  AddActivityUC: Symbol("AddActivityUC"),
  UpdateActivityUC: Symbol("UpdateActivityUC"),
  DeleteActivityUC: Symbol("DeleteActivityUC"),

  // Assessments
  AssessmentRemoteDS: Symbol("AssessmentRemoteDS"),
  AssessmentRepo: Symbol("AssessmentRepo"),
  GetAssessmentsByActivityUC: Symbol("GetAssessmentsByActivityUC"),
  GetAssessmentByIdUC: Symbol("GetAssessmentByIdUC"),
  AddAssessmentUC: Symbol("AddAssessmentUC"),
  UpdateAssessmentUC: Symbol("UpdateAssessmentUC"),
  DeleteAssessmentUC: Symbol("DeleteAssessmentUC"),

  // Peer Evaluations
  PeerEvaluationRemoteDS: Symbol("PeerEvaluationRemoteDS"),
  PeerEvaluationRepo: Symbol("PeerEvaluationRepo"),
  GetPeerEvaluationsByAssessmentUC: Symbol("GetPeerEvaluationsByAssessmentUC"),
  GetPeerEvaluationByIdUC: Symbol("GetPeerEvaluationByIdUC"),
  AddPeerEvaluationUC: Symbol("AddPeerEvaluationUC"),
  UpdatePeerEvaluationUC: Symbol("UpdatePeerEvaluationUC"),
  DeletePeerEvaluationUC: Symbol("DeletePeerEvaluationUC"),
} as const;
