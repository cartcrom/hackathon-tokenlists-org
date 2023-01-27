import { Octokit } from '@octokit/core'
import { createPullRequest } from './pr-plugin'

const MyOctokit = Octokit.plugin(createPullRequest)

export function uploadFileApi(content: any, accessToken: string) {
  var encoded = btoa(JSON.stringify(content))

  const octokit = new MyOctokit({ auth: accessToken })

  octokit
    .createPullRequest({
      owner: 'Uniswap',
      repo: 'default-token-list',
      title: 'test pr',
      body: 'test',
      head: 'test-octokit',
      base: 'main' /* optional: defaults to default branch */,
      update: false /* optional: set to `true` to enable updating existing pull requests */,
      forceFork: false /* optional: force creating fork even when user has write rights */,
      changes: [
        {
          /* optional: if `files` is not passed, an empty commit is created instead */
          files: {
            'src/tokens/mainnet.json': {
              content: encoded,
              encoding: 'base64',
            },
          },
          commit: 'test pr',
        },
      ],
    })
    .then((pr) => pr?.url && window.open(pr.url, '_token_editor_pr'))
}
