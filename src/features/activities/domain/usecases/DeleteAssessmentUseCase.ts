import { AssessmentRepository } from "../repositories/AssessmentRepository";

export class DeleteAssessmentUseCase {
  constructor(private repository: AssessmentRepository) {}

  async execute(id: string): Promise<void> {
    return this.repository.deleteAssessment(id);
  }
}
