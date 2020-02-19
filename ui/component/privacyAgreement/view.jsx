// @flow
import React, { useState } from 'react';
import Button from 'component/button';
import I18nMessage from 'component/i18nMessage';
import { FormField } from 'component/common/form-components/form-field';
import { Form } from 'component/common/form-components/form';
import * as PAGES from 'constants/pages';
import { withRouter } from 'react-router-dom';
import image from 'static/img/unlocklbry.svg';

type Props = {
  setWelcomeVersion: () => void,
  setShareDataInternal: boolean => void,
  setShareDataThirdParty: boolean => void,
  history: { push: string => void },
};

function PrivacyAgreement(props: Props) {
  const { setWelcomeVersion, setShareDataInternal, setShareDataThirdParty, history } = props;
  const [share, setShare] = useState(undefined); // preload
  const [agree, setAgree] = useState(false); // preload

  function handleSubmit() {
    if (share === 'free') {
      setShareDataInternal(true);
      setShareDataThirdParty(true);
    } else if (share === 'limited') {
      setShareDataInternal(true);
      setShareDataThirdParty(false);
    } else {
      setShareDataInternal(false);
      setShareDataThirdParty(false);
    }
    setWelcomeVersion();
    history.replace(`/`);
  }

  return (
    <section className="main--contained">
      <div className={'columns'}>
        <div>
          <h1 className="section__title--large">{__('Welcome')}</h1>
          <h3 className="section__subtitle">
            {__(
              `LBRY takes privacy and choice seriously. Just a few questions before you enter the land of content freedom. `
            )}
          </h3>
        </div>
        <div>
          <img src={image} />
        </div>
      </div>
      <Form onSubmit={handleSubmit} className="section__body">
        <p className="section__subtitle">
          {__('Can this app send information about your usage to inform publishers and improve the software?')}
        </p>
        <fieldset>
          <FormField
            name={'shareFreely'}
            type="radio"
            label={
              <>
                {/*<span className="emoji">😄</span>*/}
                {__('Yes, including with third-party analytics platforms')}
              </>
            }
            helper={
              <I18nMessage
                tokens={{
                  terms: (
                    <Button
                      tabIndex="2"
                      button="link"
                      href="https://www.lbry.com/termsofservice"
                      label={__('Terms of Service')}
                    />
                  ),
                }}
              >
                Sending information to third parties (e.g. Google Analytics or Mixpanel) allows us to use detailed
                analytical reports to improve all aspects of LBRY.
              </I18nMessage>
            }
            checked={share === 'free'}
            onChange={e => setShare('free')}
          />
          <FormField
            name={'shareWithLBRY'}
            type="radio"
            checked={share === 'limited'}
            label={
              <>
                {/*<span className="emoji">🙂</span>*/}
                {__('Yes, but only with LBRY, Inc.')}
              </>
            }
            helper={
              <I18nMessage
                tokens={{
                  terms: (
                    <Button
                      tabIndex="2"
                      button="link"
                      href="https://www.lbry.com/termsofservice"
                      label={__('Terms of Service')}
                    />
                  ),
                }}
              >
                Sharing information with LBRY, Inc. allows us to report to publishers how their content is doing, as
                well as track basic usage and performance. This is the minimum required to earn rewards from LBRY, Inc.
              </I18nMessage>
            }
            onChange={e => setShare('limited')}
          />
          <FormField
            name={'shareNot'}
            type="radio"
            checked={share === 'none'}
            label={
              <>
                {/*<span className="emoji">😢</span>*/}
                {__('No')}
              </>
            }
            helper={
              <I18nMessage
                tokens={{
                  terms: (
                    <Button
                      tabIndex="2"
                      button="link"
                      href="https://www.lbry.com/termsofservice"
                      label={__('Terms of Service')}
                    />
                  ),
                }}
              >
                No information will be sent directly to LBRY, Inc. or third-parties about your usage. Note that as
                peer-to-peer software, your IP address and potentially other system information can be sent to other
                users, though this information is not stored permanently.
              </I18nMessage>
            }
            onChange={e => setShare('none')}
          />
        </fieldset>

        <p className="section__subtitle">
          <I18nMessage
            tokens={{
              terms: (
                <Button
                  tabIndex="2"
                  button="link"
                  href="https://www.lbry.com/termsofservice"
                  label={__('Terms of Service')}
                />
              ),
            }}
          >
            Do you agree to the %terms%?
          </I18nMessage>
        </p>
        <fieldset>
          <FormField
            name={'agreeButton'}
            type="radio"
            label={'Yes'}
            checked={agree === true}
            onChange={e => setAgree(e.target.checked)}
          />
          <FormField
            name={'disagreeButton'}
            type="radio"
            checked={agree === false}
            label={__('No')}
            onChange={e => setAgree(!e.target.checked)}
          />
        </fieldset>
        {share === 'none' && (
          <>
            <p className="help">
              {__(
                'While we respect the desire for maximally private usage, please note that choosing this option hurts the ability for creators to understand how their content is performing.'
              )}
            </p>
          </>
        )}
        <div className={'card__actions'}>
          <Button button="primary" label={__(`Let's go`)} disabled={!share || !agree} type="submit" />
        </div>
      </Form>
    </section>
  );
}

export default withRouter(PrivacyAgreement);
