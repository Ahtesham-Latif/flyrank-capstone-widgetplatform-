import db from '../config/db.js';

class SubmissionRepository {
  async create(submissionData) {
    const [submission] = await db('submissions')
      .insert({
        widget_id: submissionData.widget_id,
        data: JSON.stringify(submissionData.data),
        ip_address: submissionData.ip_address || null,
        geo_data: submissionData.geo_data ? JSON.stringify(submissionData.geo_data) : null
      })
      .returning('*');

    return submission;
  }

  // Tenant Scoped Fetch: Guarantees Owner A can only view submissions for their own widgets
  async findByUserId(userId) {
    const records = await db('submissions')
      .join('widgets', 'submissions.widget_id', 'widgets.id')
      .where('widgets.user_id', userId)
      .select(
        'submissions.id',
        'submissions.widget_id',
        'widgets.title as widget_title',
        'submissions.data',
        'submissions.ip_address',
        'submissions.geo_data',
        'submissions.created_at'
      )
      .orderBy('submissions.created_at', 'desc');

    return records.map((r) => ({
      ...r,
      data: JSON.parse(r.data || '{}'),
      geo_data: r.geo_data ? JSON.parse(r.geo_data) : null
    }));
  }
}

export default new SubmissionRepository();