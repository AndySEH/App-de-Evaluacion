import { NewPeerEvaluation, PeerEvaluation } from "../../domain/entities/PeerEvaluation";
import { PeerEvaluationRepository } from "../../domain/repositories/PeerEvaluationRepository";
import { PeerEvaluationDataSource } from "../datasources/PeerEvaluationDataSource";

export class PeerEvaluationRepositoryImpl implements PeerEvaluationRepository {
  constructor(private dataSource: PeerEvaluationDataSource) {}

  async getPeerEvaluationsByAssessment(assessmentId: string): Promise<PeerEvaluation[]> {
    return this.dataSource.getPeerEvaluationsByAssessment(assessmentId);
  }

  async getPeerEvaluationById(id: string): Promise<PeerEvaluation | undefined> {
    return this.dataSource.getPeerEvaluationById(id);
  }

  async addPeerEvaluation(peerEvaluation: NewPeerEvaluation): Promise<void> {
    return this.dataSource.addPeerEvaluation(peerEvaluation);
  }

  async updatePeerEvaluation(id: string, updates: Partial<PeerEvaluation>): Promise<void> {
    return this.dataSource.updatePeerEvaluation(id, updates);
  }

  async deletePeerEvaluation(id: string): Promise<void> {
    return this.dataSource.deletePeerEvaluation(id);
  }
}
