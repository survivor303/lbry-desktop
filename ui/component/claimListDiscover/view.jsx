// @flow
import type { Node } from 'react';
import classnames from 'classnames';
import React, { Fragment, useEffect, useState } from 'react';
import { withRouter } from 'react-router';
import * as CS from 'constants/claim_search';
import { createNormalizedClaimSearchKey, MATURE_TAGS } from 'lbry-redux';
import { FormField } from 'component/common/form';
import Button from 'component/button';
import moment from 'moment';
import ClaimList from 'component/claimList';
import ClaimPreview from 'component/claimPreview';
import { toCapitalCase } from 'util/string';
import I18nMessage from 'component/i18nMessage';
import * as ICONS from '../../constants/icons';

type Props = {
  uris: Array<string>,
  subscribedChannels: Array<Subscription>,
  doClaimSearch: ({}) => void,
  loading: boolean,
  personalView: boolean,
  doToggleTagFollow: string => void,
  meta?: Node,
  showNsfw: boolean,
  history: { action: string, push: string => void, replace: string => void },
  location: { search: string, pathname: string },
  claimSearchByQuery: {
    [string]: Array<string>,
  },
  hiddenUris: Array<string>,
  hiddenNsfwMessage?: Node,
  channelIds?: Array<string>,
  tags: Array<string>,
  orderBy?: Array<string>,
  defaultOrderBy?: string,
  freshness?: string,
  defaultFreshness?: string,
  header?: Node,
  headerLabel?: string | Node,
  name?: string,
  claimType?: string | Array<string>,
  defaultClaimType?: string | Array<string>,
  streamType?: string | Array<string>,
  defaultStreamType?: string | Array<string>,
  renderProperties?: Claim => Node,
  includeSupportAction?: boolean,
  noCustom?: boolean,
};

function ClaimListDiscover(props: Props) {
  // props come in with val, defaultVal, url params.
  const {
    doClaimSearch,
    claimSearchByQuery,
    tags,
    loading,
    personalView,
    meta,
    channelIds,
    showNsfw,
    history,
    location,
    hiddenUris,
    hiddenNsfwMessage,
    defaultOrderBy,
    orderBy,
    headerLabel,
    header,
    name,
    claimType,
    defaultClaimType,
    streamType,
    defaultStreamType,
    freshness,
    defaultFreshness,
    renderProperties,
    includeSupportAction,
    noCustom,
  } = props;
  const didNavigateForward = history.action === 'PUSH';
  const [page, setPage] = useState(1);
  const { search } = location;
  console.log('SEARCH', search);
  const [forceRefresh, setForceRefresh] = useState();
  const [expanded, setExpanded] = useState(false);
  const urlParams = new URLSearchParams(search);
  console.log('URL PARAMS', urlParams);

  const tagsParam = tags || urlParams.get(CS.TAGS_KEY) || null;
  const orderParam = orderBy || urlParams.get(CS.ORDER_BY_KEY) || defaultOrderBy || CS.ORDER_BY_TRENDING;
  const freshnessParam = freshness || urlParams.get(CS.FRESH_KEY) || defaultFreshness || CS.FRESH_WEEK;
  const claimTypeParam = claimType || urlParams.get(CS.CLAIM_TYPE_KEY) || defaultClaimType || CS.CLAIM_ALL;
  const streamTypeParam = streamType || urlParams.get(CS.FILE_KEY) || defaultStreamType || CS.FILE_ALL;
  const durationParam = urlParams.get(CS.DURATION_KEY) || '';
  console.log('1 INPUT', { tagsParam, orderParam, freshnessParam, claimTypeParam, streamTypeParam, durationParam });
  // Build options object
  const options: {
    page_size: number,
    page: number,
    no_totals: boolean,
    any_tags: Array<string>,
    not_tags: Array<string>,
    channel_ids: Array<string>,
    not_channel_ids: Array<string>,
    order_by: Array<string>,
    release_time?: string,
    name?: string,
    duration?: string,
    claim_type?: string | Array<string>,
    stream_types?: any,
  } = {
    page_size: CS.PAGE_SIZE,
    page,
    name,
    // no_totals makes it so the sdk doesn't have to calculate total number pages for pagination
    // it's faster, but we will need to remove it if we start using total_pages
    no_totals: true,
    any_tags: tags || [],
    channel_ids: channelIds || [],
    not_channel_ids:
      // If channelIds were passed in, we don't need not_channel_ids
      !channelIds && hiddenUris && hiddenUris.length ? hiddenUris.map(hiddenUri => hiddenUri.split('#')[1]) : [],
    not_tags: !showNsfw ? MATURE_TAGS : [],
    order_by:
      orderParam === CS.ORDER_BY_TRENDING
        ? CS.ORDER_BY_TRENDING_VALUE
        : orderParam === CS.ORDER_BY_NEW
        ? CS.ORDER_BY_NEW_VALUE
        : CS.ORDER_BY_TOP_VALUE, // Sort by top
  };

  // only show custom order when?
  if (orderParam === CS.ORDER_BY_TOP && freshness !== CS.FRESH_ALL) {
    options.release_time = `>${Math.floor(
      moment()
        .subtract(1, freshness)
        .startOf('hour')
        .unix()
    )}`;
  } else if (orderParam === CS.ORDER_BY_NEW || orderParam === CS.ORDER_BY_TRENDING) {
    // Warning - hack below
    // If users are following more than 10 channels or tags, limit results to stuff less than a year old
    // For more than 20, drop it down to 6 months
    // This helps with timeout issues for users that are following a ton of stuff
    // https://github.com/lbryio/lbry-sdk/issues/2420
    if (options.channel_ids.length > 20 || options.any_tags.length > 20) {
      console.log('STRONG THROTTLE');
      options.release_time = `>${Math.floor(
        moment()
          .subtract(3, CS.FRESH_MONTH)
          .startOf('week')
          .unix()
      )}`;
    } else if (options.channel_ids.length > 10 || options.any_tags.length > 10) {
      console.log('WEAK THROTTLE');
      options.release_time = `>${Math.floor(
        moment()
          .subtract(1, CS.FRESH_YEAR)
          .startOf('week')
          .unix()
      )}`;
    } else {
      // Hack for at least the New page until https://github.com/lbryio/lbry-sdk/issues/2591 is fixed
      options.release_time = `<${Math.floor(
        moment()
          .startOf('minute')
          .unix()
      )}`;
    }
  }

  if (durationParam) {
    if (durationParam === CS.DURATION_SHORT) {
      options.duration = '<=1800';
    } else if (durationParam === CS.DURATION_LONG) {
      options.duration = '>=1800';
    }
  }

  if (streamTypeParam && CS.FILE_TYPES.includes(streamTypeParam)) {
    if (streamTypeParam !== CS.FILE_ALL) {
      options.stream_types = [streamTypeParam];
    }
  }

  if (claimTypeParam && CS.CLAIM_TYPES.includes(claimTypeParam)) {
    if (claimTypeParam !== CS.CLAIM_ALL) {
      options.claim_type = claimTypeParam;
    }
  }

  console.log('2 OPTS', options);

  const hasMatureTags = tags && tags.some(t => MATURE_TAGS.includes(t));
  const claimSearchCacheQuery = createNormalizedClaimSearchKey(options);
  const uris = claimSearchByQuery[claimSearchCacheQuery] || [];
  const shouldPerformSearch =
    uris.length === 0 ||
    didNavigateForward ||
    (!loading && uris.length < CS.PAGE_SIZE * page && uris.length % CS.PAGE_SIZE === 0);
  // Don't use the query from createNormalizedClaimSearchKey for the effect since that doesn't include page & release_time
  const optionsStringForEffect = JSON.stringify(options);

  const noResults = (
    <div>
      <p>
        <I18nMessage
          tokens={{
            again: (
              <Button
                button="link"
                label={__('Please try again in a few seconds.')}
                onClick={() => setForceRefresh(Date.now())}
              />
            ),
          }}
        >
          Sorry, your request timed out. %again%
        </I18nMessage>
      </p>
      <p>
        <I18nMessage
          tokens={{
            contact_support: <Button button="link" label={__('contact support')} href="https://lbry.com/faq/support" />,
          }}
        >
          If you continue to have issues, please %contact_support%.
        </I18nMessage>
      </p>
    </div>
  );

  function getSearch() {
    let search = `?`;
    if (!personalView) {
      search += `${CS.TAGS_KEY}=${tagsParam}&`;
    }

    return search;
  }

  function getTimeForFreshnessParam(param) {
    switch (param) {
      case CS.FRESH_DAY:
      case CS.FRESH_WEEK:
      case CS.FRESH_MONTH:
      case CS.FRESH_YEAR:
    }
  }

  function handleChange(change) {
    const url = buildUrl(change);
    setPage(1);
    history.push(url);
  }

  function buildUrl(delta) {
    console.log('3 DELTA OBJECT', delta);
    const newUrl = new URLSearchParams();

    if (delta.key === CS.CLEAR_KEY) {
      // do stuff to clear querystring
    }

    if (orderBy) {
      newUrl.append(CS.ORDER_BY_KEY, orderParam);
    } else if (delta.key === CS.ORDER_BY_KEY) {
      newUrl.append(CS.ORDER_BY_KEY, delta.value);
    } else if (orderParam) {
      newUrl.append(CS.ORDER_BY_KEY, orderParam);
    }

    if (tags) {
      newUrl.append(CS.TAGS_KEY, tagsParam);
    } else if (delta.key === CS.TAGS_KEY) {
      newUrl.append(CS.TAGS_KEY, delta.value);
    } else if (tagsParam) {
      newUrl.append(CS.TAGS_KEY, tagsParam);
    }

    // below some level is custom only

    if (freshness) {
      newUrl.append(CS.FRESH_KEY, freshness);
    } else if (delta.key === CS.FRESH_KEY && delta.value !== CS.FRESH_ALL) {
      newUrl.append(CS.FRESH_KEY, delta.value);
    } else if (freshnessParam && freshnessParam !== CS.FRESH_ALL) {
      newUrl.append(CS.FRESH_KEY, freshnessParam);
    }

    if (claimType) {
      // maybe not do this?
      newUrl.append(CS.CLAIM_TYPE_KEY, claimType);
    } else if (delta.key === CS.CLAIM_TYPE_KEY && delta.value !== CS.CLAIM_ALL) {
      newUrl.append(CS.CLAIM_TYPE_KEY, delta.value);
    } else if (claimTypeParam && claimTypeParam !== CS.CLAIM_ALL) {
      newUrl.append(CS.CLAIM_TYPE_KEY, claimTypeParam);
    }
    if (options.claim_type !== CS.CLAIM_CHANNEL) {
      if (streamType) {
        newUrl.append(CS.FILE_KEY, streamType);
      } else if (delta.key === CS.FILE_KEY && delta.value !== CS.FILE_ALL) {
        newUrl.append(CS.FILE_KEY, delta.value);
      } else if (streamTypeParam && streamTypeParam !== CS.FILE_ALL) {
        newUrl.append(CS.FILE_KEY, streamTypeParam);
      }

      if (delta.key === CS.DURATION_KEY) {
        if (delta.value !== CS.DURATION_ALL) {
          newUrl.append(CS.DURATION_KEY, delta.value);
        }
      }
    }

    console.log('4 NEW URL', newUrl.toString());
    return `?${newUrl.toString()}`;
  }

  function handleScrollBottom() {
    if (!loading) {
      setPage(page + 1);
    }
  }

  useEffect(() => {
    if (shouldPerformSearch) {
      const searchOptions = JSON.parse(optionsStringForEffect);
      doClaimSearch(searchOptions);
    }
  }, [doClaimSearch, shouldPerformSearch, optionsStringForEffect, forceRefresh]);

  const defaultHeader = (
    <Fragment>
      <div className={'claim-search__wrapper'}>
        {CS.ORDER_BY_TYPES.map(type => (
          <Button
            key={type}
            button="alt"
            onClick={e =>
              handleChange({
                key: CS.ORDER_BY_KEY,
                value: type,
              })
            }
            className={classnames(`button-toggle button-toggle--${type}`, {
              'button-toggle--active': orderParam === type,
            })}
            icon={toCapitalCase(type)}
            label={__(toCapitalCase(type))}
          />
        ))}
        {!noCustom && (
          <Button
            button={'alt'}
            aria-label={__('More')}
            className={classnames(`button-toggle button-toggle--top`, {
              'button-toggle--active': expanded,
            })}
            icon={toCapitalCase(ICONS.SETTINGS)}
            onClick={() => setExpanded(!expanded)}
          />
        )}
        {expanded && (
          <div className={classnames('card--inline', `claim-search__menus`)}>
            {/* FRESHNESS FIELD */}
            {orderParam === CS.ORDER_BY_TOP && (
              <div className={'claim-search__input-container'}>
                <FormField
                  className="claim-search__dropdown"
                  type="select"
                  name="trending_time"
                  label={__('How Fresh')}
                  value={freshnessParam}
                  onChange={e =>
                    handleChange({
                      key: CS.FRESH_KEY,
                      value: e.target.value,
                    })
                  }
                >
                  {CS.FRESH_TYPES.map(time => (
                    <option key={time} value={time}>
                      {/* i18fixme */}
                      {time === CS.FRESH_DAY && __('Today')}
                      {time !== CS.FRESH_ALL &&
                        time !== CS.FRESH_DAY &&
                        __('This ' + toCapitalCase(time)) /* yes, concat before i18n, since it is read from const */}
                      {time === CS.FRESH_ALL && __('All time')}
                    </option>
                  ))}
                </FormField>
              </div>
            )}
            {/* CLAIM_TYPES FIELD */}
            <div className={'claim-search__input-container'}>
              <FormField
                className="claim-search__dropdown"
                type="select"
                name="claimType"
                label={__('Claim Type')}
                value={options.stream_type || CS.FILE_ALL}
                onChange={e =>
                  handleChange({
                    key: CS.CLAIM_TYPE_KEY,
                    value: e.target.value,
                  })
                }
              >
                {CS.CLAIM_TYPES.map(type => (
                  <option key={type} value={type}>
                    {/* i18fixme */}
                    {type === CS.CLAIM_CHANNEL && __('Channel')}
                    {type === CS.CLAIM_STREAM && __('Content')}
                    {type === CS.CLAIM_REPOST && __('Repost')}
                    {type === CS.CLAIM_ALL && __('Any')}
                  </option>
                ))}
              </FormField>
            </div>
            {/* FILE_TYPES FIELD */}
            {options.claim_type !== CS.CLAIM_CHANNEL && (
              <>
                <div className={'claim-search__input-container'}>
                  <FormField
                    className="claim-search__dropdown"
                    type="select"
                    name="fileType"
                    label={__('File Type')}
                    disabled={options.claim_type === CS.CLAIM_CHANNEL}
                    value={options.stream_type || CS.FILE_ALL}
                    onChange={e =>
                      handleChange({
                        key: CS.FILE_KEY,
                        value: e.target.value,
                      })
                    }
                  >
                    {CS.FILE_TYPES.map(type => (
                      <option key={type} value={type}>
                        {/* i18fixme */}
                        {type === CS.FILE_VIDEO && __('Video')}
                        {type === CS.FILE_AUDIO && __('Audio')}
                        {type === CS.FILE_DOCUMENT && __('Document')}
                        {type === CS.FILE_ALL && __('Any')}
                      </option>
                    ))}
                  </FormField>
                </div>

                {/* DURATIONS FIELD */}
                {options.stream_types !== [CS.FILE_DOCUMENT] && (
                  <div className={'claim-search__input-container'}>
                    <FormField
                      className="claim-search__dropdown"
                      label={__('How Long')}
                      type="select"
                      name="file_type"
                      value={options.duration || CS.DURATION_ALL}
                      onChange={e =>
                        handleChange({
                          key: CS.DURATION_KEY,
                          value: e.target.value,
                        })
                      }
                    >
                      {CS.DURATION_TYPES.map(dur => (
                        <option key={dur} value={dur}>
                          {/* i18fixme */}
                          {dur === CS.DURATION_SHORT && __('Short')}
                          {dur === CS.DURATION_LONG && __('Long')}
                          {dur === CS.DURATION_ALL && __('Any')}
                        </option>
                      ))}
                    </FormField>
                  </div>
                )}
              </>
            )}
            {(options.duration || options.stream_type || options.claim_type) && (
              <div className={'claim-search__input-container'}>
                <Button
                  key={'clear'}
                  button="alt"
                  onClick={e =>
                    handleChange({
                      key: CS.CLEAR_KEY,
                      value: true,
                    })
                  }
                  label={__('Clear')}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {hasMatureTags && hiddenNsfwMessage}
    </Fragment>
  );

  return (
    <React.Fragment>
      <ClaimList
        id={claimSearchCacheQuery}
        loading={loading}
        uris={uris}
        header={header || defaultHeader}
        headerLabel={headerLabel}
        headerAltControls={meta}
        onScrollBottom={handleScrollBottom}
        page={page}
        pageSize={CS.PAGE_SIZE}
        empty={noResults}
        renderProperties={renderProperties}
        includeSupportAction={includeSupportAction}
      />

      <div className="card">
        {loading && new Array(CS.PAGE_SIZE).fill(1).map((x, i) => <ClaimPreview key={i} placeholder="loading" />)}
      </div>
    </React.Fragment>
  );
}

export default withRouter(ClaimListDiscover);
