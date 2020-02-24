// @flow
import * as ICONS from 'constants/icons';
import React, { useState } from 'react';
import Button from 'component/button';
import ClaimListDiscover from 'component/claimListDiscover';
import Nag from 'component/common/nag';
import { Form, FormField } from 'component/common/form';
import Icon from 'component/common/icon';

type Props = {};

function UserChannelFollowIntro(props: Props) {
  const { subscribedChannels, onContinue } = props;
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchQueryToPass, setSearchQueryToPass] = React.useState('');
  const followingCount = (subscribedChannels && subscribedChannels.length) || 0;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQueryToPass(searchQuery);
    }, 200);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery, setSearchQueryToPass]);

  return (
    <React.Fragment>
      <h1 className="section__title--large">{__('Find Channels to Follow')}</h1>
      <p className="section__subtitle">
        {__(
          'LBRY works better if you find and follow at least 5 creators you like. You can also block channels you never want to see.'
        )}
      </p>
      <ClaimListDiscover
        defaultOrderBy={['effective_amount']}
        pageSize={99}
        claimType="channel"
        text={searchQueryToPass}
        noInfiniteScroll
        header={
          <Form onSubmit={() => {}} className="wunderbar--large">
            <Icon icon={ICONS.SEARCH} size={18} />
            <FormField
              className="wunderbar__input"
              onChange={e => setSearchQuery(e.target.value)}
              value={searchQuery}
              type="text"
              name="query"
              placeholder={__('Search...')}
            />
          </Form>
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
          onClick={onContinue}
        />
      )}
    </React.Fragment>
  );
}

export default UserChannelFollowIntro;
