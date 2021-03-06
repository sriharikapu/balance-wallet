import { isSameDay } from 'date-fns';
import { get, join, map } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Piwik from 'react-native-matomo';
import {
  compose,
  shouldUpdate,
  withHandlers,
  withProps,
  withState,
} from 'recompact';
import styled from 'styled-components/primitives';
import BlurOverlay from '../components/BlurOverlay';
import { AssetList } from '../components/asset-list';
import { FabWrapper } from '../components/fab';
import { CameraHeaderButton, Header, ProfileHeaderButton } from '../components/header';
import { Page } from '../components/layout';
import buildWalletSections from '../helpers/buildWalletSections';
import { getShowShitcoinsSetting, updateShowShitcoinsSetting } from '../model/localstorage';
import {
  withAccountAddress,
  withAccountAssets,
  withAccountRefresh,
  withFetchingPrices,
  withBlurTransitionProps,
  withTrackingDate,
} from '../hoc';
import { position } from '../styles';

const WalletPage = styled(Page)`
  ${position.size('100%')};
  flex: 1;
`;

class WalletScreen extends Component {
  static propTypes = {
    blurOpacity: PropTypes.object,
    isEmpty: PropTypes.bool.isRequired,
    fetchingAssets: PropTypes.bool.isRequired,
    navigation: PropTypes.object,
    onRefreshList: PropTypes.func.isRequired,
    sections: PropTypes.array,
    showBlur: PropTypes.bool,
    transitionProps: PropTypes.object,
  }

  componentDidMount = async () => {
    this.props.trackingDateInit();
    const showShitcoins = await getShowShitcoinsSetting();
    if (showShitcoins !== null) {
      this.props.toggleShowShitcoins(showShitcoins);
    }
  }

  componentDidUpdate = (prevProps) => {
    const {
      allAssetsCount,
      assets,
      assetsTotal,
      fetchingAssets,
      trackingDate,
      uniqueTokens,
    } = this.props;
    if (this.props.isScreenActive && !prevProps.isScreenActive) {
      Piwik.trackScreen('WalletScreen', 'WalletScreen');
      const totalTrackingAmount = get(assetsTotal, 'totalTrackingAmount', null);
      const assetSymbols = join(map(assets, (asset) => asset.symbol));
      if (totalTrackingAmount && (!this.props.trackingDate || !isSameDay(this.props.trackingDate, Date.now()))) {
        Piwik.trackEvent('Balance', 'AssetsCount', 'TotalAssetsCount', allAssetsCount);
        Piwik.trackEvent('Balance', 'AssetSymbols', 'AssetSymbols', assetSymbols);
        Piwik.trackEvent('Balance', 'NFTCount', 'TotalNFTCount', uniqueTokens.length);
        Piwik.trackEvent('Balance', 'Total', 'TotalUSDBalance', totalTrackingAmount);
        this.props.updateTrackingDate();
      }
    }
  }

  render = () => {
    const {
      blurOpacity,
      isEmpty,
      fetchingAssets,
      navigation,
      onRefreshList,
      sections,
      showBlur,
    } = this.props;

    return (
      <WalletPage>
        {showBlur && <BlurOverlay opacity={blurOpacity} />}
        <Header justify="space-between">
          <ProfileHeaderButton navigation={navigation} />
          <CameraHeaderButton navigation={navigation} />
        </Header>
        <FabWrapper disable={isEmpty || fetchingAssets}>
          <AssetList
            fetchData={onRefreshList}
            isEmpty={isEmpty}
            isLoading={fetchingAssets}
            sections={sections}
          />
        </FabWrapper>
      </WalletPage>
    );
  }
}

export default compose(
  withAccountAssets,
  withAccountRefresh,
  withFetchingPrices,
  withTrackingDate,
  withBlurTransitionProps,
  withState('showShitcoins', 'toggleShowShitcoins', true),
  withHandlers({
    onRefreshList: ({ refreshAccount }) => async () => {
      await refreshAccount();
    },
    onToggleShowShitcoins: ({ showShitcoins, toggleShowShitcoins }) => (index) => {
      if (index === 0) {
        const updatedShowShitcoinsSetting = !showShitcoins;
        toggleShowShitcoins(updatedShowShitcoinsSetting);
        updateShowShitcoinsSetting(updatedShowShitcoinsSetting);
      }
    },
  }),
  withProps(buildWalletSections),
  shouldUpdate((props, { isScreenActive, ...nextProps }) => {
    if (!isScreenActive) return false;

    const finishedFetchingPrices = props.fetchingPrices && !nextProps.fetchingPrices;
    const finishedPopulating = props.isEmpty && !nextProps.isEmpty;
    const finishedLoading = props.fetchingAssets && !nextProps.fetchingAssets;
    const newSections = props.sections !== nextProps.sections;

    return finishedPopulating || finishedLoading || finishedFetchingPrices || newSections;
  }),
)(WalletScreen);
