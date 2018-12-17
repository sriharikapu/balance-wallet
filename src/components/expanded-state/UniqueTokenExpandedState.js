import PropTypes from 'prop-types';
import React from 'react';
import { InteractionManager, Linking, Share } from 'react-native';
import Piwik from 'react-native-matomo';
import { compose, withHandlers, withProps } from 'recompact';
import { buildUniqueTokenName } from '../../helpers/assets';
import { withImageDimensionsCache } from '../../hoc';
import { colors } from '../../styles';
import { dimensionsPropType } from '../../utils';
import { Pager } from '../pager';
import { UniqueTokenAttributes, UniqueTokenImage } from '../unique-token';
import {
  AssetPanel,
  AssetPanelAction,
  AssetPanelHeader,
} from './asset-panel';
import FloatingPanel from './FloatingPanel';
import FloatingPanels from './FloatingPanels';

const PagerControlsColorVariants = {
  dark: colors.dark,
  light: colors.white,
};

const UniqueTokenExpandedState = ({
  asset,
  imageDimensions,
  onPressSend,
  onPressShare,
  onPressView,
  panelColor,
  panelHeight,
  panelWidth,
  subtitle,
  title,
}) => {
  const PanelPages = [{
    component: (
      <UniqueTokenImage
        backgroundColor={asset.background}
        imageUrl={asset.image_preview_url}
        item={asset}
        resizeMode="cover"
        size={panelHeight}
      />
    ),
    name: 'UniqueTokenImage',
  }];

  if (asset.traits.length) {
    PanelPages.push({
      component: <UniqueTokenAttributes {...asset} />,
      name: 'UniqueTokenAttributes',
    });
  }

  return (
    <FloatingPanels>
      <FloatingPanel
        color={panelColor}
        size={panelHeight}
      >
        {/*
            TODO XXX: THIS FLOATING PANEL SHOULD HAVE HORIZONTAL PADDING
            IF THE IMAGE IS A PERFECT SQUARE
        */}
        <Pager
          controlsProps={{
            bottom: UniqueTokenAttributes.padding,
            color: colors.getTextColorForBackground(panelColor, PagerControlsColorVariants),
          }}
          dimensions={{ height: panelHeight, width: panelWidth }}
          pages={PanelPages}
        />
      </FloatingPanel>
      <AssetPanel>
        <AssetPanelHeader
          subtitle={subtitle}
          title={title}
        />
        <AssetPanelAction
          icon="send"
          label="Send"
          onPress={onPressSend}
        />
        <AssetPanelAction
          icon="compass"
          label="View on OpenSea"
          onPress={onPressView}
        />
        <AssetPanelAction
          icon="share"
          label="Share"
          onPress={onPressShare}
        />
      </AssetPanel>
    </FloatingPanels>
  );
};

UniqueTokenExpandedState.propTypes = {
  asset: PropTypes.object,
  imageDimensions: dimensionsPropType,
  onPressSend: PropTypes.func,
  onPressShare: PropTypes.func,
  onPressView: PropTypes.func,
  panelColor: PropTypes.string,
  panelHeight: PropTypes.number.isRequired,
  panelWidth: PropTypes.number.isRequired,
  subtitle: PropTypes.string,
  title: PropTypes.string,
};

export default compose(
  withImageDimensionsCache,
  withProps(({ asset, imageDimensionsCache }) => ({
    imageDimensions: imageDimensionsCache[asset.image_preview_url],
    panelColor: asset.background || colors.lightestGrey,
    subtitle: asset.name
      ? `${asset.asset_contract.name} #${asset.id}`
      : asset.asset_contract.name,
    title: buildUniqueTokenName(asset),
  })),
  withProps(({ imageDimensions, panelWidth }) => ({
    panelHeight: !imageDimensions
      ? panelWidth
      : ((panelWidth * imageDimensions.height) / imageDimensions.width),
  })),
  withHandlers({
    onPressSend: ({ navigation, asset }) => () => {
      navigation.goBack();

      InteractionManager.runAfterInteractions(() => {
        Piwik.trackEvent('Navigation', 'send-nft-expanded', 'SendNftExpandedNav');
        navigation.navigate('SendScreen', { asset, isNft: true });
      });
    },
    onPressShare: ({ asset: { name, permalink } }) => () => {
      Share.share({
        title: `Share ${name} Info`,
        url: permalink,
      });
    },
    onPressView: ({ asset: { permalink } }) => () => {
      Linking.openURL(permalink);
    },
  }),
)(UniqueTokenExpandedState);
