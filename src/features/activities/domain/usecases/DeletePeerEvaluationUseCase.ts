import { PeerEvaluationRepository } from "../repositories/PeerEvaluationRepository";

export class DeletePeerEvaluationUseCase {
  constructor(private repository: PeerEvaluationRepository) {}

  async execute(id: string): Promise<void> {
    return this.repository.deletePeerEvaluation(id);
  }
}
