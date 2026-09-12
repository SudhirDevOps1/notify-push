/**
 * GitHub Webhook Adapter for NotifyPush
 * 
 * Converts incoming GitHub Webhook events (stars, issues, releases, pushes, CI workflow runs)
 * into rich, formatted NotifyPush alerts.
 */

function transformGitHubEvent(headers, payload) {
  const event = headers['x-github-event'] || headers['X-GitHub-Event'] || 'unknown';
  const repoName = payload.repository?.full_name || 'Repository';

  switch (event) {
    case 'watch':
      if (payload.action === 'started') {
        return {
          title: `⭐ New Star on ${repoName}`,
          message: `@${payload.sender?.login || 'someone'} starred your repository! Total stars: ${payload.repository?.stargazers_count || '1+'}`,
          priority: 'default',
          tags: ['star', 'sparkles'],
          clickUrl: payload.repository?.html_url
        };
      }
      break;

    case 'issues':
      return {
        title: `🐞 Issue #${payload.issue?.number} ${payload.action}: "${payload.issue?.title}"`,
        message: `Opened by @${payload.issue?.user?.login || 'user'}\n${(payload.issue?.body || '').slice(0, 120)}`,
        priority: payload.action === 'opened' ? 'high' : 'default',
        tags: ['bug', 'octocat'],
        clickUrl: payload.issue?.html_url,
        actions: [
          { action: 'view', label: 'View Issue', url: payload.issue?.html_url }
        ]
      };

    case 'release':
      if (payload.action === 'published') {
        return {
          title: `🚀 Release ${payload.release?.tag_name || ''} Published`,
          message: `${repoName}: ${payload.release?.name || 'New version'}\nBy @${payload.release?.author?.login}`,
          priority: 'high',
          tags: ['rocket', 'package'],
          clickUrl: payload.release?.html_url
        };
      }
      break;

    case 'push':
      const commitCount = payload.commits?.length || 0;
      if (commitCount === 0) return null;
      const branch = (payload.ref || '').replace('refs/heads/', '');
      const pusher = payload.pusher?.name || payload.sender?.login || 'someone';
      const headCommit = payload.head_commit?.message || 'Updated files';
      return {
        title: `🔨 ${commitCount} Commit${commitCount > 1 ? 's' : ''} pushed to ${branch}`,
        message: `${repoName} (${pusher}): "${headCommit.slice(0, 100)}"`,
        priority: 'default',
        tags: ['hammer', 'git'],
        clickUrl: payload.compare || payload.repository?.html_url
      };

    case 'workflow_run':
      const workflowName = payload.workflow?.name || 'CI';
      const conclusion = payload.workflow_run?.conclusion;
      if (conclusion === 'failure') {
        return {
          title: `❌ CI Failed: ${workflowName}`,
          message: `${repoName} on branch ${payload.workflow_run?.head_branch}: Commit "${(payload.workflow_run?.head_commit?.message || '').slice(0, 60)}"`,
          priority: 'urgent',
          tags: ['x', 'rotating_light'],
          clickUrl: payload.workflow_run?.html_url
        };
      } else if (conclusion === 'success') {
        return {
          title: `✅ CI Succeeded: ${workflowName}`,
          message: `${repoName} branch ${payload.workflow_run?.head_branch} build completed cleanly.`,
          priority: 'low',
          tags: ['white_check_mark'],
          clickUrl: payload.workflow_run?.html_url
        };
      }
      break;

    case 'ping':
      return {
        title: `🔔 GitHub Webhook Connected`,
        message: `Successfully hooked ${repoName} to NotifyPush!`,
        priority: 'default',
        tags: ['satellite', 'white_check_mark']
      };

    default:
      return {
        title: `[GitHub] ${event.toUpperCase()} Event`,
        message: `Activity detected on ${repoName} by @${payload.sender?.login || 'user'}`,
        priority: 'default',
        tags: ['octocat']
      };
  }

  return null;
}

module.exports = { transformGitHubEvent };
