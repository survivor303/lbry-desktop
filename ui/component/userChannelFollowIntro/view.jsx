// @flow
import React, { useState } from 'react';
import Button from 'component/button';
import ClaimListDiscover from 'component/claimListDiscover';
import Nag from 'component/common/nag';

type Props = {};

function UserChannelFollowIntro(props: Props) {
  const { subscribedChannels } = props;
  const followingCount = (subscribedChannels && subscribedChannels.length) || 0;
  return (
    <React.Fragment>
      <ClaimListDiscover
        defaultOrderBy={['effective_amount']}
        noInfiniteScroll
        pageSize={99}
        claimType="channel"
        header={
          <div>
            <h1 className="section__title--large">{__('Find Channels to follow')}</h1>
            <p className="section__subtitle">
              {__(
                'LBRY works better if you find and follow at least 5 creators you like. You can also block channels you never want to see.'
              )}
            </p>
          </div>
        }
      />
      {followingCount > 0 && (
        <Nag
          type="helpful"
          message={
            followingCount === 1
              ? __('Nice! You are currently following %followingCount% creator', { followingCount })
              : __('Nice! You are currently following %followingCount% creators', { followingCount })
          }
          actionText={__('Continue')}
        />
      )}
    </React.Fragment>
  );
}

export default UserChannelFollowIntro;
