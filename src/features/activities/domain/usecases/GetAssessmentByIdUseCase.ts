import { Assessment } from "../entities/Assessment";
import { AssessmentRepository } from "../repositories/AssessmentRepository";

export class GetAssessmentByIdUseCase {
  constructor(private repository: AssessmentRepository) {}

  async execute(id: string): Promise<Assessment | undefined> {
    return this.repository.getAssessmentById(id);
  }
}
