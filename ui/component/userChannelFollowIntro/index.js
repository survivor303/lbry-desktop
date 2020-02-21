import { connect } from 'react-redux';
import { selectFollowedTags, selectBlockedChannels } from 'lbry-redux';
import { selectSubscriptions } from 'redux/selectors/subscriptions';
import UserChannelFollowIntro from './view';

const select = state => ({
  followedTags: selectFollowedTags(state),
  subscribedChannels: selectSubscriptions(state),
  blockedChannels: selectBlockedChannels(state),
});

export default connect(select)(UserChannelFollowIntro);
