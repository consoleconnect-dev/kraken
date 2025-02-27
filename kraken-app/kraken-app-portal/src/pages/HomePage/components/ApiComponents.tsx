import { PageLayout } from "@/components/Layout";
import {
  useGetComponentListAPI,
  useGetComponentListSpec,
} from "@/hooks/product";
import { useAppStore } from "@/stores/app.store";
import { SPEC_VALUE } from "@/utils/constants/product";
import type { IUnifiedAsset } from "@/utils/types/common.type";
import { Col, Row, Spin } from "antd";
import { decode } from "js-base64";
import yaml from "js-yaml";
import { get, isEmpty, isUndefined, min } from "lodash";
import { useCallback, useMemo } from "react";
import ApiComponent from "./ApiComponent";

const ApiComponents = () => {
  const { currentProduct } = useAppStore();

  const { data: componentList, isLoading } =
    useGetComponentListAPI(currentProduct);

  const { data: componentWithSpec, isLoading: specLoading } =
    useGetComponentListSpec(currentProduct);

  const getTargetSpecItem = useCallback(
    (i: IUnifiedAsset) => {
      if (!componentList.data?.length || !componentWithSpec?.data?.length)
        return {};
      const targetAssetKey = i.links.find(
        (l) => l.relationship === SPEC_VALUE
      )?.targetAssetKey;

      const targetSpec = componentWithSpec?.data.find(
        (s: IUnifiedAsset) => s.metadata.key === targetAssetKey
      );

      const targetYaml = yaml.load(
        decode(get(targetSpec, "facets.baseSpec.content", ""))
      ) as any;
      return { targetSpec, targetYaml };
    },
    [componentList, componentWithSpec]
  );
  const getSupportInfo = useCallback(
    (i: IUnifiedAsset) => {
      if (!i.facets?.supportedProductTypesAndActions) return null;
      const actionTypesArr: string[] = [];
      const productTypesArr: string[] = [];
      i.facets?.supportedProductTypesAndActions?.forEach((s: any) => {
        actionTypesArr.push(...(s?.actionTypes ?? []));
        productTypesArr.push(...(s?.productTypes ?? []));
      });
      return [
        Array.from(new Set(productTypesArr)),
        Array.from(new Set(actionTypesArr)),
      ];
    },
    [componentList, componentWithSpec]
  );

  const countComponent = useMemo(() => {
    if (
      !isUndefined(componentList?.data?.length) &&
      !isUndefined(componentWithSpec?.data?.length)
    ) {
      return `(${min([
        componentList?.data?.length,
        componentWithSpec?.data?.length,
      ])})`;
    }
    if (specLoading || isLoading) {
      return "";
    }
    return "(0)";
  }, [componentList?.data, componentWithSpec?.data, specLoading, isLoading]);

  return (
    <PageLayout title={`Standard API components ${countComponent}`}>
      <Spin spinning={specLoading || isLoading}>
        <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
          {componentList?.data?.map((i: IUnifiedAsset) => {
            const { targetSpec = {}, targetYaml = {} } = getTargetSpecItem(i);
            const supportInfo = getSupportInfo(i);
            const title = targetYaml.info?.title;
            const apis =
              i?.facets?.supportedProductTypesAndActions?.length ?? 0;
            if (isEmpty(targetSpec)) {
              return null;
            }
            return (
              <Col lg={12} xl={8} sm={24} key={i.id}>
                <ApiComponent
                  item={i}
                  title={title}
                  apis={apis}
                  targetSpec={targetSpec}
                  targetYaml={targetYaml}
                  supportInfo={supportInfo}
                />
              </Col>
            );
          })}
        </Row>
      </Spin>
    </PageLayout>
  );
};

export default ApiComponents;
