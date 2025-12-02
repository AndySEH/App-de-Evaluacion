import { createContext, useContext, useMemo } from "react";

import { TOKENS } from "./tokens";

// Auth
import { AuthRemoteDataSourceImpl } from "@/src/features/auth/data/datasources/AuthRemoteDataSourceImp";
import { AuthRepositoryImpl } from "@/src/features/auth/data/repositories/AuthRepositoryImpl";
import { GetCurrentUserUseCase } from "@/src/features/auth/domain/usecases/GetCurrentUserUseCase";
import { LoginUseCase } from "@/src/features/auth/domain/usecases/LoginUseCase";
import { LogoutUseCase } from "@/src/features/auth/domain/usecases/LogoutUseCase";
import { SignupUseCase } from "@/src/features/auth/domain/usecases/SignupUseCase";

// User
import { UserRemoteDataSourceImpl } from "@/src/features/auth/data/datasources/UserRemoteDataSourceImp";
import { UserRepositoryImpl } from "@/src/features/auth/data/repositories/UserRepositoryImpl";
import { GetUserByIdUseCase } from "@/src/features/auth/domain/usecases/GetUserByIdUseCase";
import { GetUsersByIdsUseCase } from "@/src/features/auth/domain/usecases/GetUsersByIdsUseCase";
import { UpdateUserUseCase } from "@/src/features/auth/domain/usecases/UpdateUserUseCase";

// Courses
import { CourseRemoteDataSourceImp } from "@/src/features/courses/data/datasources/CourseRemoteDataSourceImp";
import { CourseRepositoryImpl } from "@/src/features/courses/data/repositories/CourseRepositoryImpl";
import { AddCourseUseCase } from "@/src/features/courses/domain/usecases/AddCourseUseCase";
import { GetCourseByIdUseCase } from "@/src/features/courses/domain/usecases/GetCourseByIdUseCase";
import { GetCoursesByStudentUseCase } from "@/src/features/courses/domain/usecases/GetCoursesByStudentUseCase";
import { GetCoursesByTeacherUseCase } from "@/src/features/courses/domain/usecases/GetCoursesByTeacherUseCase";

// Categories
import { CategoryRemoteDataSourceImp } from "@/src/features/courses/data/datasources/CategoryRemoteDataSourceImp";
import { CategoryRepositoryImpl } from "@/src/features/courses/data/repositories/CategoryRepositoryImpl";
import { AddCategoryUseCase } from "@/src/features/courses/domain/usecases/AddCategoryUseCase";
import { DeleteCategoryUseCase } from "@/src/features/courses/domain/usecases/DeleteCategoryUseCase";
import { GetCategoriesByCourseUseCase } from "@/src/features/courses/domain/usecases/GetCategoriesByCourseUseCase";
import { GetCategoryByIdUseCase } from "@/src/features/courses/domain/usecases/GetCategoryByIdUseCase";
import { UpdateCategoryUseCase } from "@/src/features/courses/domain/usecases/UpdateCategoryUseCase";

// Groups
import { GroupRemoteDataSourceImp } from "@/src/features/courses/data/datasources/GroupRemoteDataSourceImp";
import { GroupRepositoryImpl } from "@/src/features/courses/data/repositories/GroupRepositoryImpl";
import { AddGroupUseCase } from "@/src/features/courses/domain/usecases/AddGroupUseCase";
import { DeleteGroupUseCase } from "@/src/features/courses/domain/usecases/DeleteGroupUseCase";
import { GetGroupByIdUseCase } from "@/src/features/courses/domain/usecases/GetGroupByIdUseCase";
import { GetGroupsByCategoryUseCase } from "@/src/features/courses/domain/usecases/GetGroupsByCategoryUseCase";
import { GetGroupsCountByCategoryUseCase } from "@/src/features/courses/domain/usecases/GetGroupsCountByCategoryUseCase";
import { GetStudentsWithoutGroupUseCase } from "@/src/features/courses/domain/usecases/GetStudentsWithoutGroupUseCase";
import { UpdateGroupUseCase } from "@/src/features/courses/domain/usecases/UpdateGroupUseCase";

// Activities
import { ActivityRemoteDataSourceImp } from "@/src/features/activities/data/datasources/ActivityRemoteDataSourceImp";
import { ActivityRepositoryImpl } from "@/src/features/activities/data/repositories/ActivityRepositoryImpl";
import { AddActivityUseCase } from "@/src/features/activities/domain/usecases/AddActivityUseCase";
import { DeleteActivityUseCase } from "@/src/features/activities/domain/usecases/DeleteActivityUseCase";
import { GetActivitiesByCourseUseCase } from "@/src/features/activities/domain/usecases/GetActivitiesByCourseUseCase";
import { GetActivitiesCountByCourseUseCase } from "@/src/features/activities/domain/usecases/GetActivitiesCountByCourseUseCase";
import { GetActivityByIdUseCase } from "@/src/features/activities/domain/usecases/GetActivityByIdUseCase";
import { UpdateActivityUseCase } from "@/src/features/activities/domain/usecases/UpdateActivityUseCase";

// Assessments
import { AssessmentRemoteDataSourceImp } from "@/src/features/activities/data/datasources/AssessmentRemoteDataSourceImp";
import { AssessmentRepositoryImpl } from "@/src/features/activities/data/repositories/AssessmentRepositoryImpl";
import { AddAssessmentUseCase } from "@/src/features/activities/domain/usecases/AddAssessmentUseCase";
import { DeleteAssessmentUseCase } from "@/src/features/activities/domain/usecases/DeleteAssessmentUseCase";
import { GetAssessmentByIdUseCase } from "@/src/features/activities/domain/usecases/GetAssessmentByIdUseCase";
import { GetAssessmentsByActivityUseCase } from "@/src/features/activities/domain/usecases/GetAssessmentsByActivityUseCase";
import { UpdateAssessmentUseCase } from "@/src/features/activities/domain/usecases/UpdateAssessmentUseCase";

// Peer Evaluations
import { PeerEvaluationRemoteDataSourceImp } from "@/src/features/activities/data/datasources/PeerEvaluationRemoteDataSourceImp";
import { PeerEvaluationRepositoryImpl } from "@/src/features/activities/data/repositories/PeerEvaluationRepositoryImpl";
import { AddPeerEvaluationUseCase } from "@/src/features/activities/domain/usecases/AddPeerEvaluationUseCase";
import { DeletePeerEvaluationUseCase } from "@/src/features/activities/domain/usecases/DeletePeerEvaluationUseCase";
import { GetPeerEvaluationByIdUseCase } from "@/src/features/activities/domain/usecases/GetPeerEvaluationByIdUseCase";
import { GetPeerEvaluationsByAssessmentUseCase } from "@/src/features/activities/domain/usecases/GetPeerEvaluationsByAssessmentUseCase";
import { UpdatePeerEvaluationUseCase } from "@/src/features/activities/domain/usecases/UpdatePeerEvaluationUseCase";

import { Container } from "./container";

const DIContext = createContext<Container | null>(null);

export function DIProvider({ children }: { children: React.ReactNode }) {
    //useMemo is a React Hook that lets you cache the result of a calculation between re-renders.
    const container = useMemo(() => {
        const c = new Container();

        // Auth
        const authDS = new AuthRemoteDataSourceImpl();
        const authRepo = new AuthRepositoryImpl(authDS);
        c.register(TOKENS.AuthRemoteDS, authDS)
            .register(TOKENS.AuthRepo, authRepo)
            .register(TOKENS.LoginUC, new LoginUseCase(authRepo))
            .register(TOKENS.SignupUC, new SignupUseCase(authRepo))
            .register(TOKENS.LogoutUC, new LogoutUseCase(authRepo))
            .register(TOKENS.GetCurrentUserUC, new GetCurrentUserUseCase(authRepo));

        // User
        const userDS = new UserRemoteDataSourceImpl(authDS);
        const userRepo = new UserRepositoryImpl(userDS);
        c.register(TOKENS.UserRemoteDS, userDS)
            .register(TOKENS.UserRepo, userRepo)
            .register(TOKENS.UpdateUserUC, new UpdateUserUseCase(userRepo))
            .register(TOKENS.GetUserByIdUC, new GetUserByIdUseCase(userRepo))
            .register(TOKENS.GetUsersByIdsUC, new GetUsersByIdsUseCase(userRepo));

        // Courses
        const courseRemoteDS = new CourseRemoteDataSourceImp(authDS);
        const courseRepo = new CourseRepositoryImpl(courseRemoteDS);
        c.register(TOKENS.CourseRemoteDS, courseRemoteDS)
            .register(TOKENS.CourseRepo, courseRepo)
            .register(TOKENS.GetCoursesByTeacherUC, new GetCoursesByTeacherUseCase(courseRepo))
            .register(TOKENS.GetCoursesByStudentUC, new GetCoursesByStudentUseCase(courseRepo))
            .register(TOKENS.GetCourseByIdUC, new GetCourseByIdUseCase(courseRepo))
            .register(TOKENS.AddCourseUC, new AddCourseUseCase(courseRepo));

        // Categories
        const categoryRemoteDS = new CategoryRemoteDataSourceImp(authDS);
        const categoryRepo = new CategoryRepositoryImpl(categoryRemoteDS);
        c.register(TOKENS.CategoryRemoteDS, categoryRemoteDS)
            .register(TOKENS.CategoryRepo, categoryRepo)
            .register(TOKENS.GetCategoriesByCourseUC, new GetCategoriesByCourseUseCase(categoryRepo))
            .register(TOKENS.GetCategoryByIdUC, new GetCategoryByIdUseCase(categoryRepo))
            .register(TOKENS.AddCategoryUC, new AddCategoryUseCase(categoryRepo))
            .register(TOKENS.UpdateCategoryUC, new UpdateCategoryUseCase(categoryRepo))
            .register(TOKENS.DeleteCategoryUC, new DeleteCategoryUseCase(categoryRepo));

        // Groups
        const groupRemoteDS = new GroupRemoteDataSourceImp(authDS);
        const groupRepo = new GroupRepositoryImpl(groupRemoteDS);
        c.register(TOKENS.GroupRemoteDS, groupRemoteDS)
            .register(TOKENS.GroupRepo, groupRepo)
            .register(TOKENS.GetGroupsByCategoryUC, new GetGroupsByCategoryUseCase(groupRepo))
            .register(TOKENS.GetGroupsCountByCategoryUC, new GetGroupsCountByCategoryUseCase(groupRepo))
            .register(TOKENS.GetGroupByIdUC, new GetGroupByIdUseCase(groupRepo))
            .register(TOKENS.AddGroupUC, new AddGroupUseCase(groupRepo))
            .register(TOKENS.UpdateGroupUC, new UpdateGroupUseCase(groupRepo))
            .register(TOKENS.DeleteGroupUC, new DeleteGroupUseCase(groupRepo))
            .register(TOKENS.GetStudentsWithoutGroupUC, new GetStudentsWithoutGroupUseCase(courseRepo, groupRepo, userRepo));

        // Activities
        const activityRemoteDS = new ActivityRemoteDataSourceImp(authDS);
        const activityRepo = new ActivityRepositoryImpl(activityRemoteDS);
        c.register(TOKENS.ActivityRemoteDS, activityRemoteDS)
            .register(TOKENS.ActivityRepo, activityRepo)
            .register(TOKENS.GetActivitiesByCourseUC, new GetActivitiesByCourseUseCase(activityRepo))
            .register(TOKENS.GetActivitiesCountByCourseUC, new GetActivitiesCountByCourseUseCase(activityRepo))
            .register(TOKENS.GetActivityByIdUC, new GetActivityByIdUseCase(activityRepo))
            .register(TOKENS.AddActivityUC, new AddActivityUseCase(activityRepo))
            .register(TOKENS.UpdateActivityUC, new UpdateActivityUseCase(activityRepo))
            .register(TOKENS.DeleteActivityUC, new DeleteActivityUseCase(activityRepo));

        // Assessments
        const assessmentRemoteDS = new AssessmentRemoteDataSourceImp(authDS);
        const assessmentRepo = new AssessmentRepositoryImpl(assessmentRemoteDS);
        c.register(TOKENS.AssessmentRemoteDS, assessmentRemoteDS)
            .register(TOKENS.AssessmentRepo, assessmentRepo)
            .register(TOKENS.GetAssessmentsByActivityUC, new GetAssessmentsByActivityUseCase(assessmentRepo))
            .register(TOKENS.GetAssessmentByIdUC, new GetAssessmentByIdUseCase(assessmentRepo))
            .register(TOKENS.AddAssessmentUC, new AddAssessmentUseCase(assessmentRepo))
            .register(TOKENS.UpdateAssessmentUC, new UpdateAssessmentUseCase(assessmentRepo))
            .register(TOKENS.DeleteAssessmentUC, new DeleteAssessmentUseCase(assessmentRepo));

        // Peer Evaluations
        const peerEvalRemoteDS = new PeerEvaluationRemoteDataSourceImp(authDS);
        const peerEvalRepo = new PeerEvaluationRepositoryImpl(peerEvalRemoteDS);
        c.register(TOKENS.PeerEvaluationRemoteDS, peerEvalRemoteDS)
            .register(TOKENS.PeerEvaluationRepo, peerEvalRepo)
            .register(TOKENS.GetPeerEvaluationsByAssessmentUC, new GetPeerEvaluationsByAssessmentUseCase(peerEvalRepo))
            .register(TOKENS.GetPeerEvaluationByIdUC, new GetPeerEvaluationByIdUseCase(peerEvalRepo))
            .register(TOKENS.AddPeerEvaluationUC, new AddPeerEvaluationUseCase(peerEvalRepo))
            .register(TOKENS.UpdatePeerEvaluationUC, new UpdatePeerEvaluationUseCase(peerEvalRepo))
            .register(TOKENS.DeletePeerEvaluationUC, new DeletePeerEvaluationUseCase(peerEvalRepo));

        return c;
    }, []);

    return <DIContext.Provider value={container}>{children}</DIContext.Provider>;
}

export function useDI() {
    const c = useContext(DIContext);
    if (!c) throw new Error("DIProvider missing");
    return c;
}
